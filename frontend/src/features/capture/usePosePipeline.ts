import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPoseEngine, mapPoseDetectionResultToRawCanonicalPose, transformRawPoseForRuntimeVisualization } from "../../engines/pose";
import type { FilteredRuntimePose, PoseEngine, PoseEngineStatus, RawCanonicalPose } from "../../engines/pose";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
import { captureVideoFrame, type CapturedVideoFrame } from "./capturedVideoFrame";
import { LatestFrameScheduler } from "./latestFrameScheduler";
import {
  createVideoFrameProducer,
  LIVE_FRAME_PRODUCER_POLICY,
  type VideoFrameCandidate,
  type VideoFrameProducer,
} from "./videoFrameProducer";

export type CapturePosePipelineState = {
  status: PoseEngineStatus;
  engineName: string;
  errorMessage: string | null;
  isDetecting: boolean;
};

export type CapturePoseDisplayFrame = {
  sourceHeight: number;
  sourceWidth: number;
};

const initialPosePipelineState: CapturePosePipelineState = {
  status: "idle",
  engineName: "mediapipe-pose-landmarker",
  errorMessage: null,
  isDetecting: false,
};

function isVideoFrameReady(videoElement: HTMLVideoElement) {
  return videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoElement.videoWidth > 0;
}

export function nextPoseEngineTimestamp(observedAtMs: number, previousTimestampMs: number) {
  return Math.max(observedAtMs, previousTimestampMs + 0.001);
}

export function usePosePipeline() {
  const poseEngine = useMemo<PoseEngine>(() => createPoseEngine(), []);
  const [poseState, setPoseState] = useState<CapturePosePipelineState>({
    ...initialPosePipelineState,
    engineName: poseEngine.metadata.name,
  });
  const [currentRawPose, setCurrentRawPose] = useState<RawCanonicalPose | null>(null);
  const [currentFilteredPose, setCurrentFilteredPose] = useState<FilteredRuntimePose | null>(null);
  const [currentDisplayFrame, setCurrentDisplayFrame] = useState<CapturePoseDisplayFrame | null>(null);
  const isMountedRef = useRef(true);
  const statusRef = useRef<PoseEngineStatus>("idle");
  const producerRef = useRef<VideoFrameProducer | null>(null);
  const schedulerRef = useRef<LatestFrameScheduler<CapturedVideoFrame, RawCanonicalPose> | null>(null);
  const frameIndexRef = useRef(0);
  const isDetectionLoopRunningRef = useRef(false);
  const cameraSessionIdRef = useRef(0);
  const lastAcceptedCandidateAtRef = useRef(Number.NEGATIVE_INFINITY);
  const lastEngineTimestampMsRef = useRef(Number.NEGATIVE_INFINITY);
  const displayFrameRef = useRef<CapturePoseDisplayFrame | null>(null);

  const replaceDisplayFrame = useCallback((nextFrame: CapturePoseDisplayFrame | null) => {
    displayFrameRef.current = nextFrame;
    if (isMountedRef.current) setCurrentDisplayFrame(nextFrame);
  }, []);

  const stopPoseDetection = useCallback(() => {
    isDetectionLoopRunningRef.current = false;

    producerRef.current?.dispose();
    producerRef.current = null;
    schedulerRef.current?.dispose();
    schedulerRef.current = null;
    if (statusRef.current === "detecting") {
      statusRef.current = "ready";
    }

    if (!isMountedRef.current) {
      return;
    }

    setCurrentRawPose(null);
    setCurrentFilteredPose(null);
    replaceDisplayFrame(null);
    setPoseState((currentState) => ({
      ...currentState,
      isDetecting: false,
      status: currentState.status === "detecting" ? "ready" : currentState.status,
    }));
  }, [replaceDisplayFrame]);

  const initializePosePipeline = useCallback(async () => {
    if (statusRef.current === "initializing" || statusRef.current === "ready") {
      return;
    }

    statusRef.current = "initializing";
    setPoseState((currentState) => {
      return {
        ...currentState,
        status: "initializing",
        errorMessage: null,
      };
    });

    try {
      await poseEngine.initialize();

      if (!isMountedRef.current) {
        poseEngine.dispose();
        return;
      }

      statusRef.current = "ready";
      setPoseState((currentState) => ({
        ...currentState,
        status: "ready",
        errorMessage: null,
      }));
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      statusRef.current = "error";
      setPoseState((currentState) => ({
        ...currentState,
        status: "error",
        isDetecting: false,
        errorMessage:
          error instanceof Error ? error.message : "Pose pipeline could not be initialized.",
      }));
    }
  }, [poseEngine]);

  const startPoseDetection = useCallback(
    (videoElement: HTMLVideoElement | null) => {
      if (
        !videoElement ||
        statusRef.current !== "ready" ||
        isDetectionLoopRunningRef.current ||
        typeof window === "undefined"
      ) {
        return;
      }

      isDetectionLoopRunningRef.current = true;
      cameraSessionIdRef.current += 1;
      const cameraSessionId = cameraSessionIdRef.current;
      lastAcceptedCandidateAtRef.current = Number.NEGATIVE_INFINITY;
      statusRef.current = "detecting";
      setPoseState((currentState) => ({
        ...currentState,
        status: "detecting",
        isDetecting: true,
        errorMessage: null,
      }));

      const inferenceTokens = new Map<string, ReturnType<typeof captureRuntimeInstrumentation.beginInference>>();
      const frameKey = (frame: { generation: number; frameSequence: number }) => `${frame.generation}:${frame.frameSequence}`;
      const scheduler = new LatestFrameScheduler<CapturedVideoFrame, RawCanonicalPose>({
        infer: (frame) => {
          frameIndexRef.current += 1;
          const engineTimestampMs = nextPoseEngineTimestamp(
            frame.observedAtMs,
            lastEngineTimestampMsRef.current,
          );
          lastEngineTimestampMsRef.current = engineTimestampMs;
          return poseEngine.detect({
            source: frame.payload.source,
            timestampMs: engineTimestampMs,
            frameIndex: frameIndexRef.current,
          }).then((result) => mapPoseDetectionResultToRawCanonicalPose(result, {
            sourceTimestampMs: frame.sourceTimestampMs,
            frameIndex: result.frameIndex,
            cameraSessionId,
          }));
        },
        onInferenceStarted: (frame) => {
          inferenceTokens.set(frameKey(frame), captureRuntimeInstrumentation.beginInference({
            sourceFrameObservedAtMs: frame.observedAtMs,
            sourceMediaTimestampMs: frame.sourceTimestampMs,
            startedAtMs: performance.now(),
          }));
        },
        onInferenceCompleted: (frame, result, completedAtMs) => {
          const key = frameKey(frame);
          captureRuntimeInstrumentation.completeInference(inferenceTokens.get(key) ?? null, result, completedAtMs);
          inferenceTokens.delete(key);
        },
        onInferenceFailed: (frame, error) => {
          const key = frameKey(frame);
          captureRuntimeInstrumentation.failInference(inferenceTokens.get(key) ?? null, performance.now());
          inferenceTokens.delete(key);
          if (!isMountedRef.current || !isDetectionLoopRunningRef.current) return;
          producerRef.current?.dispose();
          schedulerRef.current?.dispose();
          isDetectionLoopRunningRef.current = false;
          statusRef.current = "error";
          setCurrentRawPose(null);
          setCurrentFilteredPose(null);
          setPoseState((currentState) => ({ ...currentState, status: "error", isDetecting: false,
            errorMessage: error instanceof Error ? error.message : "Pose detection could not run." }));
        },
        onFrameCoalesced: () => captureRuntimeInstrumentation.recordFrameCoalesced(),
        onPendingFrameReplaced: () => captureRuntimeInstrumentation.recordPendingFrameReplacement(),
        onStaleResultRejected: () => captureRuntimeInstrumentation.recordStaleResultRejected(),
        releaseFrame: (frame) => frame.payload.release(),
        publish: (result, frame, publishedAtMs) => {
          captureRuntimeInstrumentation.recordAcceptedResultPublication(frame.observedAtMs, publishedAtMs);
          if (isMountedRef.current && isDetectionLoopRunningRef.current) {
            if (result.landmarks2D.length > 0) {
              replaceDisplayFrame({
                sourceHeight: frame.payload.source.height,
                sourceWidth: frame.payload.source.width,
              });
            } else replaceDisplayFrame(null);
            const acceptedRawPose = result.landmarks2D.length > 0 ? result : null;
            const filteredPose = transformRawPoseForRuntimeVisualization(acceptedRawPose);
            captureRuntimeInstrumentation.associateRuntimePose(acceptedRawPose, filteredPose);
            setCurrentRawPose(acceptedRawPose);
            setCurrentFilteredPose(filteredPose);
          }
        },
      });
      scheduler.rotateSession(cameraSessionId);
      schedulerRef.current = scheduler;

      const onCandidate = (candidate: VideoFrameCandidate) => {
        if (!isDetectionLoopRunningRef.current || !isMountedRef.current || !isVideoFrameReady(videoElement)) return;
        captureRuntimeInstrumentation.recordCameraObservation({ observedAtMs: candidate.observedAtMs,
          sourceMediaTimestampMs: candidate.sourceTimestampMs, videoReadyState: videoElement.readyState });
        captureRuntimeInstrumentation.recordFrameCandidate();
        const busy = scheduler.snapshot().activeInferenceCount === 1;
        if (!busy && candidate.observedAtMs - lastAcceptedCandidateAtRef.current < LIVE_FRAME_PRODUCER_POLICY.minimumInferenceIntervalMs) {
          captureRuntimeInstrumentation.recordInferenceSkipped();
          return;
        }
        lastAcceptedCandidateAtRef.current = candidate.observedAtMs;
        const capturedFrame = captureVideoFrame(videoElement, candidate);
        if (!capturedFrame) return;
        scheduler.accept({
          payload: capturedFrame,
          sourceTimestampMs: capturedFrame.sourceTimestampMs,
          observedAtMs: capturedFrame.observedAtMs,
        });
      };
      const producer = createVideoFrameProducer(videoElement, onCandidate);
      producerRef.current = producer;
      producer.start();
    },
    [poseEngine, replaceDisplayFrame],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (!isDetectionLoopRunningRef.current) return;
      if (document.hidden) {
        producerRef.current?.pause();
        schedulerRef.current?.pause();
        captureRuntimeInstrumentation.recordProducerPaused();
      } else {
        schedulerRef.current?.resume();
        producerRef.current?.start();
        captureRuntimeInstrumentation.recordProducerResumed();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const disposePosePipeline = useCallback(() => {
    if (statusRef.current === "idle" || statusRef.current === "disposed") {
      return;
    }

    stopPoseDetection();
    poseEngine.dispose();
    statusRef.current = "disposed";
    setPoseState((currentState) => {
      return {
        ...currentState,
        status: "disposed",
        isDetecting: false,
      };
    });
  }, [poseEngine, stopPoseDetection]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopPoseDetection();
      poseEngine.dispose();
      statusRef.current = "disposed";
    };
  }, [poseEngine, stopPoseDetection]);

  return {
    currentRawPose,
    currentFilteredPose,
    currentDisplayFrame,
    poseState,
    initializePosePipeline,
    disposePosePipeline,
    startPoseDetection,
    stopPoseDetection,
  };
}
