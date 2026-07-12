import { PlaybackControls, SkeletonCanvas, Timeline, VideoPlayer } from "../../components";
import type { CompareRecordRuntimeState, PlaybackState, RecordListItem } from "../../types";
import { frameIndexToTime } from "../viewer/playbackFrameMath";
import styles from "./CompareAnalysisLayout.module.css";
import { createCompareRenderContext } from "./compareRenderContext";
import { CompareMetricDifferencePanel } from "./CompareMetricDifferencePanel";
import { useComparePlaybackController } from "./useComparePlaybackController";

export type CompareAnalysisLayoutProps = {
  leftRecord: RecordListItem;
  leftRuntime: CompareRecordRuntimeState;
  rightRecord: RecordListItem;
  rightRuntime: CompareRecordRuntimeState;
};

export function CompareAnalysisLayout({
  leftRecord,
  leftRuntime,
  rightRecord,
  rightRuntime,
}: CompareAnalysisLayoutProps) {
  const comparePlayback = useComparePlaybackController({
    leftDuration: leftRuntime.poseDataset?.duration ?? leftRuntime.recordDetail?.video?.duration ?? undefined,
    leftFps: leftRuntime.poseDataset?.fps ?? leftRuntime.recordDetail?.video?.fps ?? undefined,
    leftFrameCount: leftRuntime.poseDataset?.frameCount,
    rightDuration: rightRuntime.poseDataset?.duration ?? rightRuntime.recordDetail?.video?.duration ?? undefined,
    rightFps: rightRuntime.poseDataset?.fps ?? rightRuntime.recordDetail?.video?.fps ?? undefined,
    rightFrameCount: rightRuntime.poseDataset?.frameCount,
  });
  const canUseSharedPlayback = leftRuntime.status === "ready" && rightRuntime.status === "ready";
  const sharedPlaybackState = canUseSharedPlayback
    ? comparePlayback.playbackState
    : {
        ...comparePlayback.playbackState,
        isPlaying: false,
      };

  return (
    <section className={styles.analysis} aria-label="Compare analysis layout">
      <p className={styles.mobileNotice}>
        Compare MVP is optimized for desktop. Use a wider viewport for side-by-side analysis.
      </p>
      <div className={styles.viewerGrid}>
        <CompareViewerPanel
          label="Left"
          playback={createPanelPlaybackState(
            sharedPlaybackState,
            comparePlayback.frameMapping.leftFrame,
            leftRuntime.poseDataset?.fps,
            leftRuntime.poseDataset?.frameCount,
          )}
          record={leftRecord}
          runtime={leftRuntime}
          frameIndex={comparePlayback.frameMapping.leftFrame}
          onEnded={comparePlayback.handleVideoEnded}
          onTimeChange={canUseSharedPlayback ? comparePlayback.handleVideoTimeUpdate : undefined}
        />
        <CompareViewerPanel
          label="Right"
          playback={createPanelPlaybackState(
            sharedPlaybackState,
            comparePlayback.frameMapping.rightFrame,
            rightRuntime.poseDataset?.fps,
            rightRuntime.poseDataset?.frameCount,
          )}
          record={rightRecord}
          runtime={rightRuntime}
          frameIndex={comparePlayback.frameMapping.rightFrame}
          onEnded={comparePlayback.handleVideoEnded}
        />
      </div>
      <section className={styles.sharedPlaybackArea} aria-label="Shared compare playback">
        <Timeline
          frame={comparePlayback.frameState}
          onSeekFrame={canUseSharedPlayback ? comparePlayback.requestSeekFrame : undefined}
        />
        <PlaybackControls
          isPlaying={canUseSharedPlayback && comparePlayback.playbackState.isPlaying}
          playbackSpeed={comparePlayback.playbackState.playbackSpeed}
          onNextFrame={canUseSharedPlayback ? comparePlayback.requestNextFrame : undefined}
          onPause={comparePlayback.requestPause}
          onPlay={canUseSharedPlayback ? comparePlayback.requestPlay : undefined}
          onPlaybackSpeedChange={comparePlayback.requestPlaybackSpeed}
          onPreviousFrame={canUseSharedPlayback ? comparePlayback.requestPreviousFrame : undefined}
        />
        <div className={styles.jumpControls} aria-label="Frame jump controls">
          <button
            disabled={!canUseSharedPlayback}
            type="button"
            onClick={() => comparePlayback.requestJumpFrames(-10)}
          >
            -10 frames
          </button>
          <button
            disabled={!canUseSharedPlayback}
            type="button"
            onClick={() => comparePlayback.requestJumpFrames(10)}
          >
            +10 frames
          </button>
        </div>
        <section className={styles.syncControls} aria-label="Sync offset controls">
          <div>
            <h2>Sync offset</h2>
            <p>
              Current offset: <strong>{comparePlayback.syncOffsetFrames}</strong> frames
            </p>
          </div>
          <div className={styles.syncButtons}>
            <button
              disabled={!canUseSharedPlayback}
              type="button"
              onClick={() => comparePlayback.requestSyncOffsetDelta(-10)}
            >
              -10
            </button>
            <button
              disabled={!canUseSharedPlayback}
              type="button"
              onClick={() => comparePlayback.requestSyncOffsetDelta(-1)}
            >
              -1
            </button>
            <button
              disabled={!canUseSharedPlayback}
              type="button"
              onClick={comparePlayback.requestSyncOffsetReset}
            >
              Reset
            </button>
            <button
              disabled={!canUseSharedPlayback}
              type="button"
              onClick={() => comparePlayback.requestSyncOffsetDelta(1)}
            >
              +1
            </button>
            <button
              disabled={!canUseSharedPlayback}
              type="button"
              onClick={() => comparePlayback.requestSyncOffsetDelta(10)}
            >
              +10
            </button>
          </div>
        </section>
      </section>
      <section className={styles.sharedArea} aria-label="Shared compare analysis placeholders">
        <CompareMetricDifferencePanel
          leftFrame={comparePlayback.frameMapping.leftFrame}
          leftMetricSeries={leftRuntime.metricSeries}
          rightFrame={comparePlayback.frameMapping.rightFrame}
          rightMetricSeries={rightRuntime.metricSeries}
        />
      </section>
    </section>
  );
}

function CompareViewerPanel({
  label,
  playback,
  record,
  runtime,
  frameIndex,
  onEnded,
  onTimeChange,
}: {
  label: "Left" | "Right";
  playback: PlaybackState;
  record: RecordListItem;
  runtime: CompareRecordRuntimeState;
  frameIndex: number;
  onEnded?: () => void;
  onTimeChange?: (currentTime: number) => void;
}) {
  const renderContext = createCompareRenderContext({
    canvasId: runtime.renderContext.canvasId,
    frameIndex,
    poseDataset: runtime.poseDataset,
  });

  return (
    <article className={styles.viewerPanel} aria-label={`${label} compare viewer`}>
      <header className={styles.panelHeader}>
        <p>{label} viewer</p>
        <h2>{runtime.recordDetail?.title ?? record.title}</h2>
        <span data-status={runtime.status}>{runtime.status}</span>
      </header>

      <div className={styles.stage}>
        {runtime.status === "loading" && (
          <div className={styles.stageState} aria-live="polite">
            Loading runtime data
          </div>
        )}
        {(runtime.status === "error" || runtime.status === "missing") && (
          <div className={styles.stageState} role="alert">
            {runtime.errorMessage ?? "Runtime data is not available."}
          </div>
        )}
        {runtime.status === "ready" && (
          <>
            <VideoPlayer
              playback={playback}
              src={runtime.videoSrc ?? undefined}
              title={`${label} record video`}
              onEnded={onEnded}
              onTimeChange={onTimeChange}
            />
            <SkeletonCanvas renderContext={renderContext} />
          </>
        )}
      </div>

      <dl className={styles.runtimeSummary}>
        <div>
          <dt>Record ID</dt>
          <dd>{record.recordId}</dd>
        </div>
        <div>
          <dt>Pose frames</dt>
          <dd>{runtime.poseDataset?.frameCount ?? "Pending"}</dd>
        </div>
        <div>
          <dt>Rendered frame</dt>
          <dd>{frameIndex}</dd>
        </div>
        <div>
          <dt>Metric series</dt>
          <dd>{runtime.metricSeries === null ? "Pending" : "Loaded"}</dd>
        </div>
      </dl>
    </article>
  );
}

function createPanelPlaybackState(
  playback: PlaybackState,
  frameIndex: number,
  fps = 30,
  frameCount = 0,
): PlaybackState {
  return {
    ...playback,
    currentTime: frameIndexToTime(frameIndex, fps, frameCount),
  };
}
