import type { AnnotationMarker, FrameState } from "../../types";
import styles from "./Timeline.module.css";

export type TimelineProps = {
  frame: FrameState;
  annotations?: AnnotationMarker[];
  onAnnotationMarkerClick?: (marker: AnnotationMarker) => void;
  onSeekFrame?: (frameIndex: number) => void;
};

export function calculateAnnotationMarkerPosition(
  frameIndex: number,
  maxFrame: number,
): number | null {
  if (!Number.isFinite(frameIndex)) {
    return null;
  }

  if (!Number.isFinite(maxFrame) || maxFrame <= 0) {
    return 0;
  }

  const clampedFrameIndex = Math.min(Math.max(frameIndex, 0), maxFrame);

  return (clampedFrameIndex / maxFrame) * 100;
}

export function Timeline({
  frame,
  annotations = [],
  onAnnotationMarkerClick,
  onSeekFrame,
}: TimelineProps) {
  const maxFrame = Math.max(0, frame.totalFrames - 1);

  return (
    <section className={styles.timeline} aria-label="Timeline">
      <div className={styles.summary}>
        Frame {frame.currentFrame} / {frame.totalFrames}
      </div>
      <div className={styles.track}>
        <input
          aria-label="Current frame"
          className={styles.slider}
          max={maxFrame}
          min={0}
          type="range"
          value={frame.currentFrame}
          onChange={(event) => onSeekFrame?.(Number(event.target.value))}
        />
        <div className={styles.markers} aria-label="Annotation markers">
          {annotations.map((annotation) => {
            const markerPosition = calculateAnnotationMarkerPosition(
              annotation.frameIndex,
              maxFrame,
            );

            if (markerPosition === null) {
              return null;
            }

            return (
              <button
                aria-label={`Annotation marker: ${annotation.title}`}
                aria-pressed={annotation.frameIndex === frame.currentFrame}
                className={styles.marker}
                key={annotation.annotationId}
                style={{ left: `${markerPosition}%` }}
                type="button"
                onClick={() => onAnnotationMarkerClick?.(annotation)}
              >
                <span className={styles.markerLabel}>{annotation.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
