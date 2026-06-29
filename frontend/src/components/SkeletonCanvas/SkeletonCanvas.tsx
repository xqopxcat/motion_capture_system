import type { RenderContext } from "../../types";
import styles from "./SkeletonCanvas.module.css";

export type SkeletonCanvasProps = {
  renderContext: RenderContext;
};

export function SkeletonCanvas({ renderContext }: SkeletonCanvasProps) {
  // TODO: Sprint 1+ calls the Visualization Engine here; this component must not draw skeletons directly.
  return (
    <canvas
      aria-label="Skeleton canvas"
      className={styles.canvas}
      data-frame-index={renderContext.frameIndex}
      data-mode={renderContext.mode}
      id={renderContext.canvasId}
    />
  );
}

