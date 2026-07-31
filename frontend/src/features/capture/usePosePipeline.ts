import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPoseEngine } from "../../engines/pose";
import type { PoseDetectionResult, PoseEngine, PoseEngineStatus } from "../../engines/pose";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
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

const initialPosePipelineState: CapturePosePipelineState = {
  status: "idle",
  engineName: "mediapipe-pose-landmarker",
  errorMessage: null,
  isDetecting: false,
};

function isVideoFrameReady(videoElement: HTMLVideoElement) {
  return videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoElement.videoWidth > 0;
}

function getDetectionTimestampMs(videoElement: HTMLVideoElement) {
  if (Number.isFinite(videoElement.currentTime) && videoElement.currentTime > 0) {
    return Math.floor(videoElement.currentTime * 1000);
  }

  return Math.floor(performance.now());
}

export function usePosePipeline() {
  const poseEngine = useMemo<PoseEngine>(() => createPoseEngine(), []);
  const [poseState, setPoseState] = useState<CapturePosePipelineState>({
    ...initialPosePipelineState,
    engineName: poseEngine.metadata.name,
  });
  const [currentPoseResult, setCurrentPoseResult] = useState<PoseDetectionResult | null>(null);
  const isMountedRef = useRef(true);
  const statusRef = useRef<PoseEngineStatus>("idle");
  const producerRef = useRef<VideoFrameProducer | null>(null);
  const schedulerRef = useRef<LatestFrameScheduler<HTMLVideoElement, PoseDetectionResult> | null>(null);
  const frameIndexRef = useRef(0);
  const isDetectionLoopRunningRef = useRef(false);
  const cameraSessionIdRef = useRef(0);
  const lastAcceptedCandidateAtRef = useRef(Number.NEGATIVE_INFINITY);
  const lastDetectionTimestampMsRef = useRef(0);

  const stopPoseDetection = useCallback(() => {
    isDetectionLoopRunningRef.current = false;

    producerRef.current?.dispose();
    producerRef.current = null;
    schedulerRef.current?.dispose();
    schedulerRef.current = null;
    lastDetectionTimestampMsRef.current = 0;
    if (statusRef.current === "detecting") {
      statusRef.current = "ready";
    }

    if (!isMountedRef.current) {
      return;
    }

    setCurrentPoseResult(null);
    setPoseState((currentState) => ({
      ...currentState,
      isDetecting: false,
      status: currentState.status === "detecting" ? "ready" : currentState.status,
    }));
  }, []);

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
      const scheduler = new LatestFrameScheduler<HTMLVideoElement, PoseDetectionResult>({
        infer: (frame) => {
          frameIndexRef.current += 1;
          const sourceTimestampMs = frame.sourceTimestampMs > 0
            ? Math.floor(frame.sourceTimestampMs) : getDetectionTimestampMs(frame.payload);
          const timestampMs = Math.max(sourceTimestampMs, lastDetectionTimestampMsRef.current + 1);
          lastDetectionTimestampMsRef.current = timestampMs;
          return poseEngine.detect({ source: frame.payload, timestampMs, frameIndex: frameIndexRef.current });
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
          setCurrentPoseResult(null);
          setPoseState((currentState) => ({ ...currentState, status: "error", isDetecting: false,
            errorMessage: error instanceof Error ? error.message : "Pose detection could not run." }));
        },
        onFrameCoalesced: () => captureRuntimeInstrumentation.recordFrameCoalesced(),
        onPendingFrameReplaced: () => captureRuntimeInstrumentation.recordPendingFrameReplacement(),
        onStaleResultRejected: () => captureRuntimeInstrumentation.recordStaleResultRejected(),
        publish: (result, frame, publishedAtMs) => {
          captureRuntimeInstrumentation.recordAcceptedResultPublication(frame.observedAtMs, publishedAtMs);
          if (isMountedRef.current && isDetectionLoopRunningRef.current) {
            setCurrentPoseResult(result.landmarks2D.length > 0 ? result : null);
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
        scheduler.accept({ payload: videoElement, sourceTimestampMs: candidate.sourceTimestampMs, observedAtMs: candidate.observedAtMs });
      };
      const producer = createVideoFrameProducer(videoElement, onCandidate);
      producerRef.current = producer;
      producer.start();
    },
    [poseEngine],
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
    currentPoseResult,
    poseState,
    initializePosePipeline,
    disposePosePipeline,
    startPoseDetection,
    stopPoseDetection,
  };
}
