import { CameraPreview } from "../../components";
import { CaptureSkeletonOverlay, RecordedPosePreview } from "../../features/capture";
import { useCapturePipeline } from "../../hooks";
import styles from "./CapturePage.module.css";

function formatElapsedTime(elapsedSeconds: number) {
  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function CapturePage() {
  const {
    cameraPreview,
    captureViewState,
    currentPoseResult,
    localRecording,
    poseDatasetDraft,
    poseFrameCollection,
    posePipeline,
    previewVideoElement,
  } = useCapturePipeline();
  const poseStatusText =
    posePipeline.poseState.status === "detecting"
      ? "Detecting pose"
      : posePipeline.poseState.status === "ready"
        ? "Pose ready"
        : posePipeline.poseState.status === "initializing"
          ? "Preparing pose"
          : posePipeline.poseState.status === "error"
            ? "Pose unavailable"
            : "Pose idle";
  const poseDatasetFrameCount = poseDatasetDraft?.metadata.frameCount ?? 0;

  return (
    <main className={styles.capturePage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Motion Capture</p>
          <h1 className={styles.title}>Capture</h1>
          <p className={styles.description}>
            Record a movement sample locally, review the captured video, and verify the pose overlay
            before continuing.
          </p>
        </header>

        <section className={styles.captureWorkspace} aria-label="Capture workspace">
          <div className={styles.livePanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>Live capture</p>
                <h2 className={styles.sectionTitle}>Camera and pose preview</h2>
              </div>
              <span className={captureViewState.isCameraReady ? styles.statusReady : styles.statusIdle}>
                {captureViewState.isCameraReady ? "Camera ready" : "Camera off"}
              </span>
            </div>

            <div className={styles.previewContainer}>
              <CameraPreview
                stream={cameraPreview.stream}
                status={cameraPreview.status}
                errorMessage={cameraPreview.errorMessage}
                onStart={cameraPreview.startCamera}
                onStop={cameraPreview.stopCamera}
                onVideoElementChange={cameraPreview.onVideoElementChange}
              />
              <CaptureSkeletonOverlay poseResult={currentPoseResult} videoElement={previewVideoElement} />
            </div>
          </div>

          <section className={styles.recordingPanel} aria-label="Capture session controls">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>Session</p>
                <h2 className={styles.sectionTitle}>Recording controls</h2>
              </div>
              <span className={captureViewState.isRecording ? styles.statusRecording : styles.statusIdle}>
                {captureViewState.isRecording ? "Recording" : "Standby"}
              </span>
            </div>

            <div className={styles.recordingStatus}>
              <div className={styles.recordingPrimaryStatus}>
                <p className={styles.timer}>{formatElapsedTime(localRecording.elapsedSeconds)}</p>
                <p className={styles.statusText}>{captureViewState.primaryStatusText}</p>
              </div>
              <div className={styles.recordingSecondaryStatus}>
                <p className={styles.panelLabel}>Pose data</p>
                <p className={styles.statusText}>
                  {poseStatusText} · {poseFrameCollection.collectedPoseFrameCount} frames collected
                </p>
                <p className={styles.statusText}>
                  Dataset {poseDatasetFrameCount > 0 ? `${poseDatasetFrameCount} frames` : "pending"}
                </p>
              </div>
            </div>

            {posePipeline.poseState.errorMessage && (
              <p className={styles.poseError} role="status">
                Pose detection unavailable: {posePipeline.poseState.errorMessage}
              </p>
            )}

            {localRecording.errorMessage && (
              <p className={styles.error} role="alert">
                {localRecording.errorMessage}
              </p>
            )}

            <div className={styles.recordingActions}>
              <button
                className={styles.recordAction}
                type="button"
                onClick={localRecording.startRecording}
                disabled={!captureViewState.canStartRecording}
              >
                Start Recording
              </button>
              <button
                className={styles.stopAction}
                type="button"
                onClick={localRecording.stopRecording}
                disabled={!captureViewState.canStopRecording}
              >
                Stop Recording
              </button>
            </div>
          </section>
        </section>

        {captureViewState.hasRecordedPreview && localRecording.recordedVideoUrl && (
          <section className={styles.recordedPreview} aria-label="Recorded video preview">
            <div className={styles.recordedPreviewHeader}>
              <div>
                <p className={styles.panelLabel}>Recorded preview</p>
                <h2 className={styles.previewTitle}>Review local recording</h2>
              </div>
              <button
                className={styles.secondaryAction}
                type="button"
                onClick={localRecording.resetRecordingResult}
              >
                Clear Preview
              </button>
            </div>
            <RecordedPosePreview
              poseDatasetDraft={poseDatasetDraft}
              videoUrl={localRecording.recordedVideoUrl}
            />
          </section>
        )}
      </section>
    </main>
  );
}
