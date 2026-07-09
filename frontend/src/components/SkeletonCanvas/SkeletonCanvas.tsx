import { useEffect, useRef } from "react";
import { renderVisualization } from "../../engines/visualization";
import type { PoseDatasetLandmark, RenderContext } from "../../types";
import styles from "./SkeletonCanvas.module.css";

const JOINT_HIT_RADIUS = 14;

export type SkeletonCanvasProps = {
  onJointClick?: (jointId: number) => void;
  renderContext: RenderContext;
};

function syncCanvasSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * pixelRatio));
  const height = Math.max(1, Math.floor(rect.height * pixelRatio));

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  return {
    height,
    width,
  };
}

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
    if (landmark.visibility < 0.35) {
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

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const canvasSize = syncCanvasSize(canvas);

    renderVisualization(canvas, {
      ...renderContext,
      canvasSize,
    });
  }, [renderContext]);

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
