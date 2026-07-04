import { useEffect, useRef } from "react";
import { renderVisualization } from "../../engines/visualization";
import type { RenderContext } from "../../types";
import styles from "./SkeletonCanvas.module.css";

export type SkeletonCanvasProps = {
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

export function SkeletonCanvas({ renderContext }: SkeletonCanvasProps) {
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
    />
  );
}
