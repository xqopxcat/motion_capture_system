import { SkeletonCanvas, VideoPlayer } from "../../components";
import type { CompareRecordRuntimeState, PlaybackState, RecordListItem } from "../../types";
import styles from "./CompareAnalysisLayout.module.css";

const staticPanelPlayback: PlaybackState = {
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackSpeed: 1,
};

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
  return (
    <section className={styles.analysis} aria-label="Compare analysis layout">
      <p className={styles.mobileNotice}>
        Compare MVP is optimized for desktop. Use a wider viewport for side-by-side analysis.
      </p>
      <div className={styles.viewerGrid}>
        <CompareViewerPanel label="Left" record={leftRecord} runtime={leftRuntime} />
        <CompareViewerPanel label="Right" record={rightRecord} runtime={rightRuntime} />
      </div>
      <section className={styles.sharedArea} aria-label="Shared compare analysis placeholders">
        <PlaceholderPanel
          title="Shared timeline"
          description="Timeline synchronization starts in Task 50."
        />
        <PlaceholderPanel
          title="Playback controls"
          description="Shared playback controls start in Task 50."
        />
        <PlaceholderPanel
          title="Metric difference"
          description="Metric difference display starts in Task 52."
        />
      </section>
    </section>
  );
}

function CompareViewerPanel({
  label,
  record,
  runtime,
}: {
  label: "Left" | "Right";
  record: RecordListItem;
  runtime: CompareRecordRuntimeState;
}) {
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
              playback={staticPanelPlayback}
              src={runtime.videoSrc ?? undefined}
              title={`${label} record video`}
            />
            <SkeletonCanvas renderContext={runtime.renderContext} />
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
          <dt>Metric series</dt>
          <dd>{runtime.metricSeries === null ? "Pending" : "Loaded"}</dd>
        </div>
      </dl>
    </article>
  );
}

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.placeholderPanel}>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
