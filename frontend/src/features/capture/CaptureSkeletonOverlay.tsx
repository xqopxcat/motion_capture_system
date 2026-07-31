import { useEffect, useRef } from "react";
import type { PoseDetectionResult } from "../../engines/pose";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
import { renderCaptureSkeleton } from "./renderCaptureSkeleton";
import { PRODUCTION_SKELETON_PROFILE, syncProductionCanvasSize } from "../../engines/visualization";
import styles from "./CaptureSkeletonOverlay.module.css";

export type CaptureSkeletonOverlayProps = {
  poseResult: PoseDetectionResult | null;
  videoElement?: HTMLVideoElement | null;
};

export function CaptureSkeletonOverlay({ poseResult, videoElement }: CaptureSkeletonOverlayProps) {
  captureRuntimeInstrumentation.recordReactRender("CaptureSkeletonOverlay");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const startedAtMs = performance.now();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      captureRuntimeInstrumentation.recordCanvasRender({
        endedAtMs: performance.now(),
        poseResult,
        rendered: false,
        startedAtMs,
      });
      return;
    }

    syncProductionCanvasSize(canvas);
    renderCaptureSkeleton(
      canvas,
      context,
      poseResult,
      videoElement
        ? {
            sourceWidth: videoElement.videoWidth,
            sourceHeight: videoElement.videoHeight,
          }
        : undefined,
    );
    captureRuntimeInstrumentation.recordCanvasRender({
      endedAtMs: performance.now(),
      poseResult,
      rendered: true,
      startedAtMs,
    });
    if (!poseResult) return;
    const staleTimeout = window.setTimeout(() => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }, PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs);
    return () => window.clearTimeout(staleTimeout);
  }, [poseResult, videoElement]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.overlayCanvas}
      aria-label="Capture skeleton overlay"
      width={1280}
      height={720}
    />
  );
}
