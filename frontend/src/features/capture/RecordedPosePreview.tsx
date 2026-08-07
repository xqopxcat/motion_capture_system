import { useCallback, useEffect, useRef, useState } from "react";
import type { CapturePoseDatasetDraft } from "./buildPoseDatasetDraft";
import { findActivePoseDatasetFrame } from "./findNearestPoseDatasetFrame";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
import { clearCaptureSkeleton, renderCaptureSkeleton } from "./renderCaptureSkeleton";
import { renderFormalAngleOverlay, syncProductionCanvasSize } from "../../engines/visualization";
import { calculateSelectedFormalJointAngles, type FormalJointAngleResult } from "../../engines/motionModel";
import type { CapturePoseDatasetDraftFrame } from "./buildPoseDatasetDraft";
import { CAPTURE_ANGLE_INTEGRATION_PROFILE } from "./captureAngleIntegrationProfile";
import styles from "./RecordedPosePreview.module.css";

export const MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX = 560;

export type RecordedPosePreviewProps = {
  poseDatasetDraft: CapturePoseDatasetDraft | null;
  videoUrl: string;
  disabled?: boolean;
  skeletonVisible?: boolean;
  anglesVisible?: boolean;
};

export type RecordedFormalAngleCache = Readonly<{
  dataset: CapturePoseDatasetDraft;
  videoUrl: string;
  profileKey: string;
  frameIndex: number;
  timestampMs: number;
  results: readonly FormalJointAngleResult[];
}>;

const RECORDED_ANGLE_PROFILE_KEY = `${CAPTURE_ANGLE_INTEGRATION_PROFILE.id}@${CAPTURE_ANGLE_INTEGRATION_PROFILE.version}:${CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds.join(",")}`;

export function resolveRecordedFormalAngles(
  cache: RecordedFormalAngleCache | null,
  dataset: CapturePoseDatasetDraft | null,
  videoUrl: string,
  frame: CapturePoseDatasetDraftFrame | null,
  calculate: typeof calculateSelectedFormalJointAngles = calculateSelectedFormalJointAngles,
): Readonly<{ cache: RecordedFormalAngleCache | null; results: readonly FormalJointAngleResult[] | null; computed: boolean }> {
  if (!dataset || !frame) return { cache: null, results: null, computed: false };
  if (cache && cache.dataset === dataset && cache.videoUrl === videoUrl && cache.profileKey === RECORDED_ANGLE_PROFILE_KEY && cache.frameIndex === frame.frameIndex && cache.timestampMs === frame.timestampMs) {
    return { cache, results: cache.results, computed: false };
  }
  const results = calculate(frame, CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds);
  const next = Object.freeze({ dataset, videoUrl, profileKey: RECORDED_ANGLE_PROFILE_KEY, frameIndex: frame.frameIndex, timestampMs: frame.timestampMs, results });
  return { cache: next, results, computed: true };
}

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

export function recordedPreviewMaximumWidth(aspectRatio: number) {
  return aspectRatio * MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX;
}

export function RecordedPosePreview({
  poseDatasetDraft,
  videoUrl,
  disabled = false,
  skeletonVisible = true,
  anglesVisible = false,
}: RecordedPosePreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const formalAngleCacheRef = useRef<RecordedFormalAngleCache | null>(null);
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
      ? findActivePoseDatasetFrame(poseDatasetDraft.frames, currentTimeMs)
      : null;
    if (!poseFrame) formalAngleCacheRef.current = null;
    captureRuntimeInstrumentation.recordPreviewSelection({
      poseFrameIndex: poseFrame?.frameIndex ?? null,
      poseTimestampMs: poseFrame?.timestampMs ?? null,
      videoTimestampMs: currentTimeMs,
    });

    clearCaptureSkeleton(canvas, context);
    if (!poseFrame || (!skeletonVisible && !anglesVisible)) {
      return;
    }
    const viewport = video.videoWidth > 0 && video.videoHeight > 0
        ? { sourceWidth: video.videoWidth, sourceHeight: video.videoHeight }
        : undefined;
    try {
      if (skeletonVisible) renderCaptureSkeleton(canvas, context, poseFrame, viewport, 0, "contain", false, false);
      if (anglesVisible) {
        const resolved = resolveRecordedFormalAngles(formalAngleCacheRef.current, poseDatasetDraft, videoUrl, poseFrame);
        formalAngleCacheRef.current = resolved.cache;
        if (resolved.results) renderFormalAngleOverlay(canvas, context, poseFrame, resolved.results, { selectedMetricIds: CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds, sourceViewport: viewport, objectFit: "contain", mirror: false, clear: false });
      }
    } catch {
      clearCaptureSkeleton(canvas, context);
    }
  }, [anglesVisible, poseDatasetDraft, skeletonVisible, videoUrl]);

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
    formalAngleCacheRef.current = null;
    setVideoAspectRatio(16 / 9);
  }, [poseDatasetDraft, videoUrl]);

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
        style={{
          aspectRatio: videoAspectRatio,
          maxWidth: recordedPreviewMaximumWidth(videoAspectRatio),
        }}
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
          hidden={!skeletonVisible && !anglesVisible}
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
