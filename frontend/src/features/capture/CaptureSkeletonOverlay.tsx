import { useEffect, useRef } from "react";
import type { FilteredRuntimePose } from "../../engines/pose";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
import { renderCaptureSkeleton } from "./renderCaptureSkeleton";
import { PRODUCTION_SKELETON_PROFILE, syncProductionCanvasSize } from "../../engines/visualization";
import styles from "./CaptureSkeletonOverlay.module.css";
import type { CapturePoseDisplayFrame } from "./usePosePipeline";

export type CaptureSkeletonOverlayProps = {
  poseResult: FilteredRuntimePose | null;
  videoElement?: HTMLVideoElement | null;
  visible?: boolean;
  displayFrame?: CapturePoseDisplayFrame | null;
};

export function CaptureSkeletonOverlay({ displayFrame, poseResult, videoElement, visible = true }: CaptureSkeletonOverlayProps) {
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
    if (!visible) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      captureRuntimeInstrumentation.recordCanvasRender({
        endedAtMs: performance.now(),
        poseResult,
        rendered: false,
        startedAtMs,
      });
      return;
    }
    renderCaptureSkeleton(
      canvas,
      context,
      poseResult,
      displayFrame
        ? { sourceWidth: displayFrame.sourceWidth, sourceHeight: displayFrame.sourceHeight }
        : videoElement
        ? {
            sourceWidth: videoElement.videoWidth,
            sourceHeight: videoElement.videoHeight,
          }
        : undefined,
      0,
      "contain",
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
  }, [displayFrame, poseResult, videoElement, visible]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.overlayCanvas}
      aria-label="Capture skeleton overlay"
      width={1280}
      height={720}
      hidden={!visible}
    />
  );
}
