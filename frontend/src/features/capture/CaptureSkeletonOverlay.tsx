import { useEffect, useRef } from "react";
import type { FilteredRuntimePose } from "../../engines/pose";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
import { renderCaptureSkeleton } from "./renderCaptureSkeleton";
import { PRODUCTION_SKELETON_PROFILE, renderRuntimeAngleOverlay, syncProductionCanvasSize } from "../../engines/visualization";
import { calculateSelectedRuntimeJointAngles } from "../../engines/motionModel";
import { CAPTURE_ANGLE_INTEGRATION_PROFILE } from "./captureAngleIntegrationProfile";
import styles from "./CaptureSkeletonOverlay.module.css";
import type { CapturePoseDisplayFrame } from "./usePosePipeline";

export type CaptureSkeletonOverlayProps = {
  poseResult: FilteredRuntimePose | null;
  videoElement?: HTMLVideoElement | null;
  visible?: boolean;
  displayFrame?: CapturePoseDisplayFrame | null;
  anglesVisible?: boolean;
  mirror?: boolean;
};

export function CaptureSkeletonOverlay({ anglesVisible = false, displayFrame, mirror = false, poseResult, videoElement, visible = true }: CaptureSkeletonOverlayProps) {
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
    if (!visible && !anglesVisible) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      captureRuntimeInstrumentation.recordCanvasRender({
        endedAtMs: performance.now(),
        poseResult,
        rendered: false,
        startedAtMs,
      });
      return;
    }
    const viewport = displayFrame
        ? { sourceWidth: displayFrame.sourceWidth, sourceHeight: displayFrame.sourceHeight }
        : videoElement
        ? {
            sourceWidth: videoElement.videoWidth,
            sourceHeight: videoElement.videoHeight,
          }
        : undefined;
    context.clearRect(0, 0, canvas.width, canvas.height);
    try {
      if (poseResult && visible) renderCaptureSkeleton(canvas, context, poseResult, viewport, 0, "contain", false, mirror);
      if (poseResult && anglesVisible) {
        const angleStartedAtMs = performance.now();
        const results = calculateSelectedRuntimeJointAngles(poseResult, CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds);
        captureRuntimeInstrumentation.recordAngleCalculation(angleStartedAtMs, performance.now(), poseResult, results);
        renderRuntimeAngleOverlay(canvas, context, poseResult, results, { selectedMetricIds: CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds, sourceViewport: viewport, objectFit: "contain", mirror, poseAgeMs: 0, clear: false });
      }
    } catch {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    captureRuntimeInstrumentation.recordCanvasRender({
      endedAtMs: performance.now(),
      poseResult,
      rendered: true,
      startedAtMs,
    });
    const bounds = canvas.getBoundingClientRect();
    captureRuntimeInstrumentation.recordRenderingContext({ mirror, objectFit: "contain", sourceWidth: viewport?.sourceWidth ?? null, sourceHeight: viewport?.sourceHeight ?? null, canvasWidth: canvas.width, canvasHeight: canvas.height, canvasCssWidth: bounds.width, canvasCssHeight: bounds.height, devicePixelRatio: window.devicePixelRatio });
    if (!poseResult) return;
    const staleTimeout = window.setTimeout(() => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }, PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs);
    return () => window.clearTimeout(staleTimeout);
  }, [anglesVisible, displayFrame, mirror, poseResult, videoElement, visible]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.overlayCanvas}
      aria-label="Capture skeleton overlay"
      width={1280}
      height={720}
      hidden={!visible && !anglesVisible}
    />
  );
}
