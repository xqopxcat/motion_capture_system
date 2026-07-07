import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  MetricPanel,
  PlaybackControls,
  SkeletonCanvas,
  Timeline,
  VideoPlayer,
} from "../../components";
import { createViewerRenderContext, useViewerArtifactLoader } from "../../features/viewer";
import { useMetricSeriesLoader, usePlaybackController, usePoseLoader } from "../../hooks";
import { useGetRecordDetailQuery } from "../../services/recordsApi";
import type { MetricDisplayValue, PoseDataset, RecordDetail, RecordDetailMetricSummary } from "../../types";
import styles from "./RecordViewerPage.module.css";

const LOCAL_DEMO_RECORD_ID = "local-demo";

export function RecordViewerPage() {
  const { recordId } = useParams();
  const [searchParams] = useSearchParams();
  const shouldUseLocalFallback =
    recordId === LOCAL_DEMO_RECORD_ID || searchParams.get("poseFixture") === LOCAL_DEMO_RECORD_ID;
  const localArtifactState = useViewerArtifactLoader(recordId, searchParams);
  const {
    data: recordDetail,
    isError: isRecordError,
    isLoading: isRecordLoading,
  } = useGetRecordDetailQuery(recordId ?? "", {
    skip: !recordId || shouldUseLocalFallback,
  });
  const poseLoader = usePoseLoader(
    !shouldUseLocalFallback && recordDetail?.status === "Ready" ? recordDetail.pose?.url : null,
  );
  const metricSeriesLoader = useMetricSeriesLoader(
    !shouldUseLocalFallback && recordDetail?.status === "Ready"
      ? recordDetail.metrics?.seriesUrl
      : null,
  );
  const poseDataset = shouldUseLocalFallback
    ? localArtifactState.poseDataset
    : poseLoader.poseDataset;
  const videoSrc = shouldUseLocalFallback
    ? localArtifactState.videoSrc
    : recordDetail?.video?.url ?? null;
  const metrics = shouldUseLocalFallback
    ? localArtifactState.metrics
    : mapMetricSummaryToDisplayValues(recordDetail?.metrics?.summary ?? []);
  const artifactState = resolveViewerState({
    isRecordError,
    isRecordLoading,
    localArtifactState,
    metricErrorMessage: metricSeriesLoader.errorMessage,
    metricSeriesLoading: metricSeriesLoader.isMetricSeriesLoading,
    poseDataset,
    poseErrorMessage: poseLoader.errorMessage,
    poseLoading: poseLoader.isPoseLoading,
    recordDetail,
    recordId,
    shouldUseLocalFallback,
    videoSrc,
  });
  const {
    frameState,
    handleVideoDurationChange,
    handleVideoEnded,
    handleVideoTimeUpdate,
    playbackState,
    requestNextFrame,
    requestPause,
    requestPlaybackSpeed,
    requestPlay,
    requestPreviousFrame,
    requestSeekFrame,
    setPlaybackBounds,
  } = usePlaybackController({
    duration: poseDataset?.duration ?? 0,
    fps: poseDataset?.fps ?? 30,
    totalFrames: poseDataset?.frameCount ?? 0,
  });
  const renderContext = createViewerRenderContext({
    canvasId: "record-viewer-skeleton-canvas",
    currentFrame: frameState.currentFrame,
    poseDataset,
  });

  useEffect(() => {
    setPlaybackBounds({
      duration: poseDataset?.duration ?? 0,
      fps: poseDataset?.fps ?? 30,
      totalFrames: poseDataset?.frameCount ?? 0,
    });
  }, [poseDataset, setPlaybackBounds]);

  return (
    <main className={styles.viewerPage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Viewer Foundation</p>
          <h1 className={styles.title}>{recordDetail?.title ?? "Record Viewer"}</h1>
          <p className={styles.description}>
            Ready Record viewer for video playback, pose.v1 skeleton replay, and available metric
            context.
          </p>
        </header>

        {artifactState.status === "loading" && (
          <section className={styles.statePanel} aria-live="polite">
            <h2>Loading viewer artifacts</h2>
            <p>Preparing Record Detail, video, pose.v1, and metric-series data.</p>
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
            <p>{artifactState.errorMessage}</p>
          </section>
        )}

        {artifactState.status === "ready" && (
          <section className={styles.viewerWorkspace} aria-label="Viewer workspace">
            <div className={styles.mediaColumn}>
              <div className={styles.viewerStage}>
                <VideoPlayer
                  playback={playbackState}
                  src={videoSrc ?? undefined}
                  onDurationChange={handleVideoDurationChange}
                  onEnded={handleVideoEnded}
                  onTimeChange={handleVideoTimeUpdate}
                />
                <SkeletonCanvas renderContext={renderContext} />
              </div>
              <Timeline frame={frameState} onSeekFrame={requestSeekFrame} />
              <PlaybackControls
                isPlaying={playbackState.isPlaying}
                playbackSpeed={playbackState.playbackSpeed}
                onNextFrame={requestNextFrame}
                onPause={requestPause}
                onPlay={requestPlay}
                onPlaybackSpeedChange={requestPlaybackSpeed}
                onPreviousFrame={requestPreviousFrame}
              />
            </div>

            <aside className={styles.sidePanel} aria-label="Viewer artifact summary">
              <section className={styles.summaryPanel}>
                <p className={styles.panelLabel}>Record</p>
                <h2>{artifactState.recordId}</h2>
                <dl className={styles.summaryList}>
                  <div>
                    <dt>Pose frames</dt>
                    <dd>{poseDataset?.frameCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>FPS</dt>
                    <dd>{poseDataset?.fps ?? recordDetail?.video?.fps ?? "Pending"}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{poseDataset?.duration ?? recordDetail?.video?.duration ?? 0}s</dd>
                  </div>
                </dl>
              </section>
              <MetricPanel metrics={metrics} />
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}

type RecordViewerStateInput = {
  isRecordError: boolean;
  isRecordLoading: boolean;
  localArtifactState: ReturnType<typeof useViewerArtifactLoader>;
  metricErrorMessage: string | null;
  metricSeriesLoading: boolean;
  poseDataset: PoseDataset | null;
  poseErrorMessage: string | null;
  poseLoading: boolean;
  recordDetail?: RecordDetail;
  recordId?: string;
  shouldUseLocalFallback: boolean;
  videoSrc: string | null;
};

function resolveViewerState({
  isRecordError,
  isRecordLoading,
  localArtifactState,
  metricErrorMessage,
  metricSeriesLoading,
  poseDataset,
  poseErrorMessage,
  poseLoading,
  recordDetail,
  recordId,
  shouldUseLocalFallback,
  videoSrc,
}: RecordViewerStateInput) {
  if (shouldUseLocalFallback) {
    return localArtifactState;
  }

  if (!recordId) {
    return {
      errorMessage: "Viewer route is missing a record id.",
      recordId: "",
      status: "error" as const,
    };
  }

  if (isRecordLoading || poseLoading || metricSeriesLoading) {
    return {
      errorMessage: null,
      recordId,
      status: "loading" as const,
    };
  }

  if (isRecordError || !recordDetail) {
    return {
      errorMessage: "Record Detail could not be loaded.",
      recordId,
      status: "error" as const,
    };
  }

  if (recordDetail.status !== "Ready") {
    return {
      errorMessage: `Record is ${recordDetail.status}. Finalize it before opening the Viewer.`,
      recordId,
      status: "missing" as const,
    };
  }

  if (!videoSrc) {
    return {
      errorMessage: "Ready Record is missing a video URL.",
      recordId,
      status: "missing" as const,
    };
  }

  if (!recordDetail.pose?.url) {
    return {
      errorMessage: "Ready Record is missing a pose.v1 URL.",
      recordId,
      status: "missing" as const,
    };
  }

  if (poseErrorMessage) {
    return {
      errorMessage: poseErrorMessage,
      recordId,
      status: "error" as const,
    };
  }

  if (metricErrorMessage) {
    return {
      errorMessage: metricErrorMessage,
      recordId,
      status: "error" as const,
    };
  }

  if (!poseDataset) {
    return {
      errorMessage: "Pose Dataset is not available.",
      recordId,
      status: "missing" as const,
    };
  }

  return {
    errorMessage: null,
    recordId,
    status: "ready" as const,
  };
}

function mapMetricSummaryToDisplayValues(
  summary: RecordDetailMetricSummary[],
): MetricDisplayValue[] {
  return summary.map((item) => ({
    id: item.metricId,
    label: item.metricId,
    value: `${item.average} avg / ${item.rangeOfMotion} ROM`,
  }));
}
