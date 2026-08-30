import { useMemo } from "react";
import { PlaybackControls, SkeletonCanvas, Timeline, VideoPlayer } from "../../components";
import type { CompareRecordRuntimeState, PlaybackState, PoseDataset, RecordListItem } from "../../types";
import { frameIndexToTime, frameTimestamp } from "../viewer/playbackFrameMath";
import styles from "./CompareAnalysisLayout.module.css";
import { createCompareRenderContext } from "./compareRenderContext";
import { CompareMetricDifferencePanel } from "./CompareMetricDifferencePanel";
import {
  getPrimaryCompareRuntimeMessage,
  hasBlockingCompareRuntimeIssue,
} from "./compareRuntimeIssues";
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
  const leftFrameTimestamps = useMemo(
    () => leftRuntime.poseDataset?.frames.map((frame) => frame.timestamp) ?? [],
    [leftRuntime.poseDataset],
  );
  const rightFrameTimestamps = useMemo(
    () => rightRuntime.poseDataset?.frames.map((frame) => frame.timestamp) ?? [],
    [rightRuntime.poseDataset],
  );
  const comparePlayback = useComparePlaybackController({
    leftDuration: leftRuntime.poseDataset?.duration ?? leftRuntime.recordDetail?.video?.duration ?? undefined,
    leftFps: leftRuntime.poseDataset?.fps ?? leftRuntime.recordDetail?.video?.fps ?? undefined,
    leftFrameCount: leftRuntime.poseDataset?.frameCount,
    rightDuration: rightRuntime.poseDataset?.duration ?? rightRuntime.recordDetail?.video?.duration ?? undefined,
    rightFps: rightRuntime.poseDataset?.fps ?? rightRuntime.recordDetail?.video?.fps ?? undefined,
    rightFrameCount: rightRuntime.poseDataset?.frameCount,
    leftFrameTimestamps,
    rightFrameTimestamps,
  });
  const canUseSharedPlayback =
    leftRuntime.status === "ready" &&
    rightRuntime.status === "ready" &&
    !hasBlockingCompareRuntimeIssue(leftRuntime) &&
    !hasBlockingCompareRuntimeIssue(rightRuntime);
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
      <div className={styles.workspaceGrid}>
        <div className={styles.motionWorkspace}>
      <div className={styles.viewerGrid}>
        <CompareViewerPanel
          label="Left"
          playback={createPanelPlaybackState(
            sharedPlaybackState,
            comparePlayback.frameMapping.leftFrame,
            leftRuntime.poseDataset,
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
            rightRuntime.poseDataset,
          )}
          record={rightRecord}
          runtime={rightRuntime}
          frameIndex={comparePlayback.frameMapping.rightFrame}
          onEnded={comparePlayback.handleVideoEnded}
          syncWhilePlaying
        />
      </div>
      <section className={styles.sharedPlaybackArea} aria-label="Shared compare playback">
        <header className={styles.playbackHeader}>
          <div>
            <p>Playback & alignment</p>
            <h2>Review both records together</h2>
          </div>
          <span>Left is the timeline reference</span>
        </header>
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
            <h2>Right record alignment</h2>
            <p>
              Right is <strong>{comparePlayback.syncOffsetFrames >= 0 ? "+" : ""}{comparePlayback.syncOffsetFrames} frames</strong> relative to Left.
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
        </div>
      <aside className={styles.metricRail} aria-label="Current frame metrics">
        <CompareMetricDifferencePanel
          leftFrame={comparePlayback.frameMapping.leftFrame}
          leftMetricSeries={leftRuntime.metricSeries}
          rightFrame={comparePlayback.frameMapping.rightFrame}
          rightMetricSeries={rightRuntime.metricSeries}
        />
      </aside>
      </div>
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
  syncWhilePlaying = false,
}: {
  label: "Left" | "Right";
  playback: PlaybackState;
  record: RecordListItem;
  runtime: CompareRecordRuntimeState;
  frameIndex: number;
  onEnded?: () => void;
  onTimeChange?: (currentTime: number) => void;
  syncWhilePlaying?: boolean;
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
            {getPrimaryCompareRuntimeMessage(runtime) ?? "Runtime data is not available."}
            {runtime.retry && (
              <button type="button" onClick={runtime.retry}>
                Retry
              </button>
            )}
          </div>
        )}
        {runtime.status === "ready" && runtime.videoSrc && (
          <>
            <VideoPlayer
              playback={playback}
              src={runtime.videoSrc ?? undefined}
              title={`${label} record video`}
              onEnded={onEnded}
              onTimeChange={onTimeChange}
              syncWhilePlaying={syncWhilePlaying}
            />
            <SkeletonCanvas renderContext={renderContext} />
          </>
        )}
      </div>

      {runtime.issues.length > 0 && (
        <ul className={styles.issueList} aria-label={`${label} runtime issues`}>
          {runtime.issues.map((issue) => (
            <li key={`${issue.artifact}-${issue.message}`} data-severity={issue.severity}>
              <strong>{issue.artifact}</strong>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

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
  poseDataset: PoseDataset | null,
): PlaybackState {
  const timestamps = poseDataset?.frames.map((frame) => frame.timestamp) ?? [];
  return {
    ...playback,
    currentTime: timestamps.length > 0
      ? frameTimestamp(frameIndex, timestamps)
      : frameIndexToTime(frameIndex, poseDataset?.fps ?? 30, poseDataset?.frameCount ?? 0),
  };
}
