import type { AnnotationDisplayItem, FrameState } from "../../types";
import styles from "./Timeline.module.css";

export type TimelineProps = {
  frame: FrameState;
  annotations?: AnnotationDisplayItem[];
  onSeekFrame?: (frameIndex: number) => void;
};

export function Timeline({ frame, annotations = [], onSeekFrame }: TimelineProps) {
  const maxFrame = Math.max(0, frame.totalFrames - 1);

  return (
    <section className={styles.timeline} aria-label="Timeline">
      <div className={styles.summary}>
        Frame {frame.currentFrame} / {frame.totalFrames}
      </div>
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
        {annotations.map((annotation) => (
          <span className={styles.marker} key={annotation.id}>
            {annotation.title}
          </span>
        ))}
      </div>
    </section>
  );
}
