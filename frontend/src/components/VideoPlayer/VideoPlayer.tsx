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

export function videoNeedsSeek(currentTime: number, requestedTime: number) {
  return Math.abs(currentTime - requestedTime) >= 0.001;
}

export function shouldReportMediaTime(time: number, pendingSeekTime: number | null) {
  return pendingSeekTime === null || Math.abs(time - pendingSeekTime) < 0.01;
}

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
  const pendingSeekTimeRef = useRef<number | null>(null);

  const reportMediaTime = (time: number) => {
    const pendingSeekTime = pendingSeekTimeRef.current;
    if (pendingSeekTime !== null) {
      if (!shouldReportMediaTime(time, pendingSeekTime)) return;
      pendingSeekTimeRef.current = null;
    }
    onTimeChange?.(time);
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.playbackRate = playback.playbackSpeed;
  }, [playback.playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || playback.isPlaying || !videoNeedsSeek(video.currentTime, playback.currentTime)) {
      return;
    }

    pendingSeekTimeRef.current = playback.currentTime;
    video.currentTime = playback.currentTime;
  }, [playback.currentTime, playback.isPlaying]);

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
      reportMediaTime(metadata.mediaTime);
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
        onSeeked={(event) => {
          pendingSeekTimeRef.current = null;
          onTimeChange?.(event.currentTarget.currentTime);
        }}
        onTimeUpdate={(event) => reportMediaTime(event.currentTarget.currentTime)}
      />
      <p className={styles.status}>
        {playback.isPlaying ? "Playing" : "Paused"} - {playback.playbackSpeed}x
      </p>
    </section>
  );
}
