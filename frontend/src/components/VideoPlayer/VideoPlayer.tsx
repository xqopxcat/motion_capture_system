import { useEffect, useRef } from "react";
import type { PlaybackState } from "../../types";
import styles from "./VideoPlayer.module.css";

export type VideoPlayerProps = {
  playback: PlaybackState;
  src?: string;
  title?: string;
  onDurationChange?: (duration: number) => void;
  onVideoDimensionsChange?: (width: number, height: number) => void;
  onEnded?: () => void;
  onFrameChange?: (frameIndex: number) => void;
  onTimeChange?: (currentTime: number) => void;
};

export function VideoPlayer({
  playback,
  src,
  title = "Video player",
  onDurationChange,
  onVideoDimensionsChange,
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

  useEffect(() => {
    const video = videoRef.current;

    if (!video || typeof video.requestVideoFrameCallback !== "function") {
      return;
    }

    let callbackId = 0;
    const handlePresentedFrame: VideoFrameRequestCallback = (_now, metadata) => {
      onTimeChange?.(metadata.mediaTime);
      callbackId = video.requestVideoFrameCallback(handlePresentedFrame);
    };

    callbackId = video.requestVideoFrameCallback(handlePresentedFrame);

    return () => video.cancelVideoFrameCallback(callbackId);
  }, [onTimeChange, src]);

  return (
    <section className={styles.videoPlayer} aria-label={title}>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        controls={false}
        muted
        onDurationChange={(event) => onDurationChange?.(event.currentTarget.duration)}
        onLoadedMetadata={(event) => {
          const { videoHeight, videoWidth } = event.currentTarget;

          if (videoWidth > 0 && videoHeight > 0) {
            onVideoDimensionsChange?.(videoWidth, videoHeight);
          }
        }}
        onEnded={onEnded}
        onTimeUpdate={(event) => onTimeChange?.(event.currentTarget.currentTime)}
      />
      <p className={styles.status}>
        {playback.isPlaying ? "Playing" : "Paused"} - {playback.playbackSpeed}x
      </p>
    </section>
  );
}
