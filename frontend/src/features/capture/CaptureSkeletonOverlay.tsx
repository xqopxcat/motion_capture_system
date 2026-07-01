import { useEffect, useRef } from "react";
import type { PoseDetectionResult } from "../../engines/pose";
import styles from "./CaptureSkeletonOverlay.module.css";

export type CaptureSkeletonOverlayProps = {
  poseResult: PoseDetectionResult | null;
};

export function CaptureSkeletonOverlay({ poseResult }: CaptureSkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
  }, [poseResult]);

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
