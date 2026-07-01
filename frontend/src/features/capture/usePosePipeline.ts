import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPoseEngine } from "../../engines/pose/createPoseEngine";
import type { PoseEngine } from "../../engines/pose/PoseEngine";
import type { PoseDetectionResult, PoseEngineStatus } from "../../engines/pose/types";

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

const minimumDetectIntervalMs = 66;

function isVideoFrameReady(videoElement: HTMLVideoElement) {
  return videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoElement.videoWidth > 0;
}

function getDetectionTimestampMs(videoElement: HTMLVideoElement) {
  if (Number.isFinite(videoElement.currentTime) && videoElement.currentTime > 0) {
    return videoElement.currentTime * 1000;
  }

  return performance.now();
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
  const animationFrameRef = useRef<number | null>(null);
  const frameIndexRef = useRef(0);
  const isDetectionLoopRunningRef = useRef(false);
  const isDetectingFrameRef = useRef(false);
  const lastDetectStartedAtRef = useRef(0);

  const stopPoseDetection = useCallback(() => {
    isDetectionLoopRunningRef.current = false;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isDetectingFrameRef.current = false;
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
      statusRef.current = "detecting";
      setPoseState((currentState) => ({
        ...currentState,
        status: "detecting",
        isDetecting: true,
        errorMessage: null,
      }));

      const detectNextFrame = () => {
        if (!isDetectionLoopRunningRef.current || !isMountedRef.current) {
          return;
        }

        const now = performance.now();
        const shouldDetect =
          !isDetectingFrameRef.current &&
          isVideoFrameReady(videoElement) &&
          now - lastDetectStartedAtRef.current >= minimumDetectIntervalMs;

        if (shouldDetect) {
          isDetectingFrameRef.current = true;
          lastDetectStartedAtRef.current = now;
          frameIndexRef.current += 1;

          void poseEngine
            .detect({
              source: videoElement,
              timestampMs: getDetectionTimestampMs(videoElement),
              frameIndex: frameIndexRef.current,
            })
            .then((result) => {
              if (!isMountedRef.current || !isDetectionLoopRunningRef.current) {
                return;
              }

              setCurrentPoseResult(result.landmarks2D.length > 0 ? result : null);
            })
            .catch((error) => {
              if (!isMountedRef.current) {
                return;
              }

              isDetectionLoopRunningRef.current = false;
              if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }
              statusRef.current = "error";
              setCurrentPoseResult(null);
              setPoseState((currentState) => ({
                ...currentState,
                status: "error",
                isDetecting: false,
                errorMessage:
                  error instanceof Error ? error.message : "Pose detection could not run.",
              }));
            })
            .finally(() => {
              isDetectingFrameRef.current = false;
            });
        }

        animationFrameRef.current = requestAnimationFrame(detectNextFrame);
      };

      animationFrameRef.current = requestAnimationFrame(detectNextFrame);
    },
    [poseEngine],
  );

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
