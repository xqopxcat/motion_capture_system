import type { PlaybackState } from "../../types";
import styles from "./VideoPlayer.module.css";

export type VideoPlayerProps = {
  playback: PlaybackState;
  src?: string;
  title?: string;
  onTimeChange?: (currentTime: number) => void;
  onFrameChange?: (frameIndex: number) => void;
};

export function VideoPlayer({
  playback,
  src,
  title = "Video player",
  onTimeChange,
}: VideoPlayerProps) {
  return (
    <section className={styles.videoPlayer} aria-label={title}>
      <video
        className={styles.video}
        src={src}
        controls={false}
        muted
        onTimeUpdate={(event) => onTimeChange?.(event.currentTarget.currentTime)}
      />
      <p className={styles.status}>
        {playback.isPlaying ? "Playing" : "Paused"} · {playback.playbackSpeed}x
      </p>
    </section>
  );
}
