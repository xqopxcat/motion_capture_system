import { useEffect, useRef } from "react";
import type { PlaybackState } from "../../types";
import styles from "./VideoPlayer.module.css";

export type VideoPlayerProps = {
  playback: PlaybackState;
  src?: string;
  title?: string;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onFrameChange?: (frameIndex: number) => void;
  onTimeChange?: (currentTime: number) => void;
};

export function VideoPlayer({
  playback,
  src,
  title = "Video player",
  onDurationChange,
  onEnded,
  onTimeChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.playbackRate = playback.playbackSpeed;
  }, [playback.playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || Math.abs(video.currentTime - playback.currentTime) < 0.05) {
      return;
    }

    video.currentTime = playback.currentTime;
  }, [playback.currentTime]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (playback.isPlaying) {
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [playback.isPlaying]);

  return (
    <section className={styles.videoPlayer} aria-label={title}>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        controls={false}
        muted
        onDurationChange={(event) => onDurationChange?.(event.currentTarget.duration)}
        onEnded={onEnded}
        onTimeUpdate={(event) => onTimeChange?.(event.currentTarget.currentTime)}
      />
      <p className={styles.status}>
        {playback.isPlaying ? "Playing" : "Paused"} - {playback.playbackSpeed}x
      </p>
    </section>
  );
}
