import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AnnotationDrawer,
  MetricPanel,
  PlaybackControls,
  SkeletonCanvas,
  Timeline,
  VideoPlayer,
} from "../../components";
import { createViewerRenderContext } from "../../features/viewer";
import { useMetricSeriesLoader, usePlaybackController, usePoseLoader } from "../../hooks";
import {
  useCreateAnnotationMutation,
  useDeleteAnnotationMutation,
  useGetAnnotationsQuery,
  useUpdateAnnotationMutation,
} from "../../services/annotationsApi";
import { useGetRecordDetailQuery } from "../../services/recordsApi";
import type {
  AnnotationMarker,
  MetricDisplayValue,
  PoseDataset,
  RecordDetail,
  RecordDetailMetricSummary,
} from "../../types";
import styles from "./RecordViewerPage.module.css";

export function RecordViewerPage() {
  const { recordId } = useParams();
  const [isAnnotationDrawerOpen, setIsAnnotationDrawerOpen] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [selectedJointId, setSelectedJointId] = useState<number | null>(null);
  const [createAnnotationError, setCreateAnnotationError] = useState<string | null>(null);
  const [deleteAnnotationError, setDeleteAnnotationError] = useState<string | null>(null);
  const [editAnnotationError, setEditAnnotationError] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const {
    data: recordDetail,
    isError: isRecordError,
    isLoading: isRecordLoading,
  } = useGetRecordDetailQuery(recordId ?? "", {
    skip: !recordId,
  });
  const { data: annotationsResponse } = useGetAnnotationsQuery(recordId ?? "", {
    skip: !recordId,
  });
  const [createAnnotation, createAnnotationState] = useCreateAnnotationMutation();
  const [deleteAnnotation, deleteAnnotationState] = useDeleteAnnotationMutation();
  const [updateAnnotation, updateAnnotationState] = useUpdateAnnotationMutation();
  const poseLoader = usePoseLoader(recordDetail?.status === "Ready" ? recordDetail.pose?.url : null);
  const metricSeriesLoader = useMetricSeriesLoader(
    recordDetail?.status === "Ready"
      ? recordDetail.metrics?.seriesUrl
      : null,
  );
  const poseDataset = poseLoader.poseDataset;
  const videoSrc = recordDetail?.video?.url ?? null;
  const metrics = mapMetricSummaryToDisplayValues(recordDetail?.metrics?.summary ?? []);
  const artifactState = resolveViewerState({
    isRecordError,
    isRecordLoading,
    metricErrorMessage: metricSeriesLoader.errorMessage,
    metricSeriesLoading: metricSeriesLoader.isMetricSeriesLoading,
    poseDataset,
    poseErrorMessage: poseLoader.errorMessage,
    poseLoading: poseLoader.isPoseLoading,
    recordDetail,
    recordId,
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
    highlightedJointIds: selectedJointId !== null ? [selectedJointId] : [],
    poseDataset,
    selectedJointId,
  });
  const annotationMarkers = annotationsResponse?.items ?? [];
  const jumpToAnnotationFrame = (annotation: AnnotationMarker) => {
    setSelectedAnnotationId(annotation.annotationId);
    setSelectedJointId(typeof annotation.jointId === "number" ? annotation.jointId : null);
    setIsAnnotationDrawerOpen(true);
    requestSeekFrame(annotation.frameIndex);
  };

  const selectAnnotation = (annotation: AnnotationMarker) => {
    setSelectedAnnotationId(annotation.annotationId);
    setSelectedJointId(typeof annotation.jointId === "number" ? annotation.jointId : null);
  };

  useEffect(() => {
    setPlaybackBounds({
      duration: poseDataset?.duration ?? 0,
      fps: poseDataset?.fps ?? 30,
      frameTimestamps: poseDataset?.frames.map((frame) => frame.timestamp) ?? [],
      totalFrames: poseDataset?.frameCount ?? 0,
    });
  }, [poseDataset, setPlaybackBounds]);

  useEffect(() => {
    setVideoAspectRatio(16 / 9);
  }, [videoSrc]);

  useEffect(() => {
    if (
      selectedAnnotationId &&
      !annotationMarkers.some((annotation) => annotation.annotationId === selectedAnnotationId)
    ) {
      setSelectedAnnotationId(null);
    }
  }, [annotationMarkers, selectedAnnotationId]);

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
              <div
                className={styles.viewerStage}
                style={{ aspectRatio: videoAspectRatio }}
              >
                <VideoPlayer
                  playback={playbackState}
                  src={videoSrc ?? undefined}
                  onDurationChange={handleVideoDurationChange}
                  onEnded={handleVideoEnded}
                  onTimeChange={handleVideoTimeUpdate}
                  onVideoDimensionsChange={(width, height) =>
                    setVideoAspectRatio(width / height)
                  }
                />
                <SkeletonCanvas
                  renderContext={renderContext}
                  onJointClick={(jointId) => setSelectedJointId(jointId)}
                />
              </div>
              <Timeline
                annotations={annotationMarkers}
                frame={frameState}
                onAnnotationMarkerClick={jumpToAnnotationFrame}
                onSeekFrame={requestSeekFrame}
              />
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
              <section className={styles.annotationPanel}>
                <div>
                  <p className={styles.panelLabel}>Annotations</p>
                  <h2>Record markers</h2>
                </div>
                <button
                  className={styles.annotationToggle}
                  type="button"
                  onClick={() => setIsAnnotationDrawerOpen((isOpen) => !isOpen)}
                >
                  {isAnnotationDrawerOpen ? "Hide drawer" : "Show drawer"}
                </button>
              </section>
              <section className={styles.jointPanel}>
                <div>
                  <p className={styles.panelLabel}>Joint</p>
                  <h2>
                    {selectedJointId === null ? "No joint selected" : `Joint ${selectedJointId}`}
                  </h2>
                </div>
                <button
                  className={styles.annotationToggle}
                  disabled={selectedJointId === null}
                  type="button"
                  onClick={() => setSelectedJointId(null)}
                >
                  Clear
                </button>
              </section>
              <AnnotationDrawer
                annotations={annotationMarkers}
                createErrorMessage={createAnnotationError}
                deleteErrorMessage={deleteAnnotationError}
                editErrorMessage={editAnnotationError}
                currentFrame={frameState.currentFrame}
                isCreating={createAnnotationState.isLoading}
                isDeleting={deleteAnnotationState.isLoading}
                isUpdating={updateAnnotationState.isLoading}
                isOpen={isAnnotationDrawerOpen}
                selectedAnnotationId={selectedAnnotationId}
                selectedJointId={selectedJointId}
                onCreateAnnotation={async (draft) => {
                  setCreateAnnotationError(null);

                  if (!recordId) {
                    setCreateAnnotationError("Record id is missing.");
                    return;
                  }

                  try {
                    const createdAnnotation = await createAnnotation({
                      frameIndex: frameState.currentFrame,
                      jointId: selectedJointId,
                      note: draft.note,
                      recordId,
                      timestamp: playbackState.currentTime,
                      title: draft.title,
                    }).unwrap();
                    setSelectedAnnotationId(createdAnnotation.annotationId);
                  } catch {
                    setCreateAnnotationError("Annotation could not be created.");
                  }
                }}
                onClose={() => setIsAnnotationDrawerOpen(false)}
                onDeleteAnnotation={async (annotation) => {
                  setDeleteAnnotationError(null);

                  if (!recordId) {
                    setDeleteAnnotationError("Record id is missing.");
                    return;
                  }

                  try {
                    await deleteAnnotation({
                      annotationId: annotation.annotationId,
                      recordId,
                    }).unwrap();
                    setSelectedAnnotationId(null);
                  } catch {
                    setDeleteAnnotationError("Annotation could not be deleted.");
                  }
                }}
                onJumpToAnnotation={jumpToAnnotationFrame}
                onSelectAnnotation={selectAnnotation}
                onUpdateAnnotation={async (annotation, draft) => {
                  setEditAnnotationError(null);

                  if (!recordId) {
                    setEditAnnotationError("Record id is missing.");
                    return;
                  }

                  try {
                    await updateAnnotation({
                      annotationId: annotation.annotationId,
                      note: draft.note,
                      recordId,
                      title: draft.title,
                    }).unwrap();
                  } catch {
                    setEditAnnotationError("Annotation could not be updated.");
                  }
                }}
              />
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
  metricErrorMessage: string | null;
  metricSeriesLoading: boolean;
  poseDataset: PoseDataset | null;
  poseErrorMessage: string | null;
  poseLoading: boolean;
  recordDetail?: RecordDetail;
  recordId?: string;
  videoSrc: string | null;
};

function resolveViewerState({
  isRecordError,
  isRecordLoading,
  metricErrorMessage,
  metricSeriesLoading,
  poseDataset,
  poseErrorMessage,
  poseLoading,
  recordDetail,
  recordId,
  videoSrc,
}: RecordViewerStateInput) {
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
