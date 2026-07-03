import { useParams, useSearchParams } from "react-router-dom";
import {
  MetricPanel,
  PlaybackControls,
  SkeletonCanvas,
  Timeline,
  VideoPlayer,
} from "../../components";
import { useViewerArtifactLoader } from "../../features/viewer";
import type { FrameState, PlaybackState, RenderContext } from "../../types";
import styles from "./RecordViewerPage.module.css";

export function RecordViewerPage() {
  const { recordId } = useParams();
  const [searchParams] = useSearchParams();
  const artifactState = useViewerArtifactLoader(recordId, searchParams);
  const totalFrames = artifactState.poseDataset?.frameCount ?? 0;
  const playback: PlaybackState = {
    currentTime: 0,
    duration: artifactState.poseDataset?.duration ?? 0,
    isPlaying: false,
    playbackSpeed: 1,
  };
  const frame: FrameState = {
    currentFrame: 0,
    fps: artifactState.poseDataset?.fps ?? 30,
    totalFrames,
  };
  const renderContext: RenderContext = {
    canvasId: "record-viewer-skeleton-canvas",
    frameIndex: frame.currentFrame,
    mode: "skeleton",
  };

  return (
    <main className={styles.viewerPage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Viewer Foundation</p>
          <h1 className={styles.title}>Record Viewer</h1>
          <p className={styles.description}>
            Local artifact boundary for video and pose.v1 review. Playback sync and skeleton replay
            are prepared for later Sprint 2 tasks.
          </p>
        </header>

        {artifactState.status === "loading" && (
          <section className={styles.statePanel} aria-live="polite">
            <h2>Loading viewer artifacts</h2>
            <p>Preparing local video and pose.v1 data.</p>
          </section>
        )}

        {artifactState.status === "error" && (
          <section className={styles.statePanel} role="alert">
            <h2>Viewer cannot load</h2>
            <p>{artifactState.errorMessage}</p>
          </section>
        )}

        {artifactState.status === "missing" && (
          <section className={styles.statePanel}>
            <h2>Artifacts not available</h2>
            <p>
              This viewer route is ready for local or exported artifacts, but this record does not
              currently resolve both a video source and a pose.v1 dataset.
            </p>
          </section>
        )}

        {artifactState.status === "ready" && (
          <section className={styles.viewerWorkspace} aria-label="Viewer workspace">
            <div className={styles.mediaColumn}>
              <div className={styles.viewerStage}>
                <VideoPlayer playback={playback} src={artifactState.videoSrc ?? undefined} />
                <SkeletonCanvas renderContext={renderContext} />
              </div>
              <Timeline frame={frame} />
              <PlaybackControls isPlaying={playback.isPlaying} playbackSpeed={playback.playbackSpeed} />
            </div>

            <aside className={styles.sidePanel} aria-label="Viewer artifact summary">
              <section className={styles.summaryPanel}>
                <p className={styles.panelLabel}>Record</p>
                <h2>{artifactState.recordId}</h2>
                <dl className={styles.summaryList}>
                  <div>
                    <dt>Pose frames</dt>
                    <dd>{artifactState.poseDataset?.frameCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>FPS</dt>
                    <dd>{artifactState.poseDataset?.fps ?? "Pending"}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{artifactState.poseDataset?.duration ?? 0}s</dd>
                  </div>
                </dl>
              </section>
              <MetricPanel metrics={artifactState.metrics} />
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
