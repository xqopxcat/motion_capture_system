import { useCallback, useEffect, useRef } from "react";
import { isProductionLandmarkRenderable, renderVisualization, syncProductionCanvasSize } from "../../engines/visualization";
import type { PoseDatasetLandmark, RenderContext } from "../../types";
import styles from "./SkeletonCanvas.module.css";

const JOINT_HIT_RADIUS = 14;

export type SkeletonCanvasProps = {
  onJointClick?: (jointId: number) => void;
  renderContext: RenderContext;
};

export type JointHitTestInput = {
  canvasHeight: number;
  canvasWidth: number;
  landmarks: PoseDatasetLandmark[];
  point: {
    x: number;
    y: number;
  };
  radius?: number;
};

export function findHitJointId({
  canvasHeight,
  canvasWidth,
  landmarks,
  point,
  radius = JOINT_HIT_RADIUS,
}: JointHitTestInput): number | null {
  let nearestJointId: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  landmarks.forEach((landmark) => {
    if (!isProductionLandmarkRenderable(landmark)) {
      return;
    }

    const jointX = landmark.x * canvasWidth;
    const jointY = landmark.y * canvasHeight;
    const distance = Math.hypot(point.x - jointX, point.y - jointY);

    if (distance <= radius && distance < nearestDistance) {
      nearestDistance = distance;
      nearestJointId = landmark.id;
    }
  });

  return nearestJointId;
}

export function SkeletonCanvas({ onJointClick, renderContext }: SkeletonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderContextRef = useRef(renderContext);
  renderContextRef.current = renderContext;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasSize = syncProductionCanvasSize(canvas);
    renderVisualization(canvas, { ...renderContextRef.current, canvasSize });
  }, []);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, renderContext]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(renderCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [renderCanvas]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Skeleton canvas"
      className={styles.canvas}
      data-frame-index={renderContext.frameIndex}
      data-mode={renderContext.mode}
      id={renderContext.canvasId}
      onClick={(event) => {
        if (!onJointClick || !renderContext.poseFrame) {
          return;
        }

        const canvas = event.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const point = {
          x: (event.clientX - rect.left) * (canvas.width / Math.max(1, rect.width)),
          y: (event.clientY - rect.top) * (canvas.height / Math.max(1, rect.height)),
        };
        const jointId = findHitJointId({
          canvasHeight: canvas.height,
          canvasWidth: canvas.width,
          landmarks: renderContext.poseFrame.landmarks2D,
          point,
        });

        if (jointId !== null) {
          onJointClick(jointId);
        }
      }}
    />
  );
}
