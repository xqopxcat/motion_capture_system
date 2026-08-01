import { useCallback, useEffect, useRef, useState } from "react";
import type { CapturePoseDatasetDraft } from "./buildPoseDatasetDraft";
import { findNearestPoseDatasetFrame } from "./findNearestPoseDatasetFrame";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
import { clearCaptureSkeleton, renderCaptureSkeleton } from "./renderCaptureSkeleton";
import { syncProductionCanvasSize } from "../../engines/visualization";
import styles from "./RecordedPosePreview.module.css";

export type RecordedPosePreviewProps = {
  poseDatasetDraft: CapturePoseDatasetDraft | null;
  videoUrl: string;
  disabled?: boolean;
  skeletonVisible?: boolean;
};

function formatPreviewTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function recordedPreviewAspectRatio(videoWidth: number, videoHeight: number) {
  return videoWidth > 0 && videoHeight > 0 ? videoWidth / videoHeight : 16 / 9;
}

export function RecordedPosePreview({
  poseDatasetDraft,
  videoUrl,
  disabled = false,
  skeletonVisible = true,
}: RecordedPosePreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);

  const syncCurrentTime = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setCurrentTimeSeconds(video.currentTime);
  }, []);

  const renderCurrentFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!video || !canvas || !context) {
      return;
    }

    syncProductionCanvasSize(canvas);
    const currentTimeMs = video.currentTime * 1000;
    setCurrentTimeSeconds(video.currentTime);
    const poseFrame = poseDatasetDraft
      ? findNearestPoseDatasetFrame(poseDatasetDraft.frames, currentTimeMs)
      : null;
    captureRuntimeInstrumentation.recordPreviewSelection({
      poseFrameIndex: poseFrame?.frameIndex ?? null,
      poseTimestampMs: poseFrame?.timestampMs ?? null,
      videoTimestampMs: currentTimeMs,
    });

    if (!poseFrame || !skeletonVisible) {
      clearCaptureSkeleton(canvas, context);
      return;
    }

    renderCaptureSkeleton(
      canvas,
      context,
      poseFrame,
      video.videoWidth > 0 && video.videoHeight > 0
        ? { sourceWidth: video.videoWidth, sourceHeight: video.videoHeight }
        : undefined,
      0,
      "contain",
    );
  }, [poseDatasetDraft, skeletonVisible]);

  const stopPlaybackSync = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const startPlaybackSync = useCallback(() => {
    stopPlaybackSync();

    const renderLoop = () => {
      renderCurrentFrame();

      if (!videoRef.current?.paused && !videoRef.current?.ended) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [renderCurrentFrame, stopPlaybackSync]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;

    if (!video || disabled) {
      return;
    }

    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  }, [disabled]);

  const seekTo = useCallback(
    (nextTimeSeconds: number) => {
      const video = videoRef.current;

      if (!video || disabled) {
        return;
      }

      video.currentTime = nextTimeSeconds;
      setCurrentTimeSeconds(nextTimeSeconds);
      renderCurrentFrame();
    },
    [disabled, renderCurrentFrame],
  );

  useEffect(() => {
    if (!disabled) return;
    videoRef.current?.pause();
    stopPlaybackSync();
  }, [disabled, stopPlaybackSync]);

  useEffect(() => {
    renderCurrentFrame();
  }, [renderCurrentFrame]);

  useEffect(() => {
    setVideoAspectRatio(16 / 9);
  }, [videoUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => renderCurrentFrame());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [renderCurrentFrame]);

  useEffect(() => {
    return () => {
      stopPlaybackSync();
    };
  }, [stopPlaybackSync]);

  return (
    <div className={styles.recordedPosePreview}>
      <div
        className={styles.previewSurface}
        data-testid="recorded-preview-surface"
        style={{ aspectRatio: videoAspectRatio }}
      >
        <video
          ref={videoRef}
          className={styles.video}
          src={videoUrl}
          tabIndex={disabled ? -1 : undefined}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setDurationSeconds(video.duration ?? 0);
            setVideoAspectRatio(recordedPreviewAspectRatio(video.videoWidth, video.videoHeight));
            renderCurrentFrame();
          }}
          onPlay={() => {
            setIsPlaying(true);
            startPlaybackSync();
          }}
          onPause={() => {
            setIsPlaying(false);
            renderCurrentFrame();
          }}
          onEnded={() => {
            setIsPlaying(false);
            renderCurrentFrame();
          }}
          onSeeked={renderCurrentFrame}
          onTimeUpdate={() => {
            syncCurrentTime();
            renderCurrentFrame();
          }}
        />
        <canvas
          ref={canvasRef}
          className={styles.overlayCanvas}
          aria-label="Recorded pose skeleton overlay"
          width={1280}
          height={720}
          hidden={!skeletonVisible}
        />
      </div>

      <div className={styles.controls} aria-label="Recorded preview controls">
        <button className={styles.playButton} type="button" onClick={togglePlayback} disabled={disabled}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          className={styles.timeline}
          type="range"
          min="0"
          max={Number.isFinite(durationSeconds) ? durationSeconds : 0}
          step="0.01"
          value={currentTimeSeconds}
          onChange={(event) => seekTo(Number(event.currentTarget.value))}
          aria-label="Recorded preview timeline"
          disabled={disabled}
        />
        <span className={styles.timeText}>
          {formatPreviewTime(currentTimeSeconds)} / {formatPreviewTime(durationSeconds)}
        </span>
      </div>
    </div>
  );
}
