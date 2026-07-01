import { CameraPreview } from "../../components";
import { CaptureSkeletonOverlay } from "../../features/capture";
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
    posePipeline,
    previewVideoElement,
  } = useCapturePipeline();

  return (
    <main className={styles.capturePage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Sprint 1 Capture Foundation</p>
          <h1 className={styles.title}>Capture</h1>
          <p className={styles.description}>
            Start camera preview to prepare a capture session. Recording stays local in the browser;
            pose detection, overlays, upload, and record creation remain out of scope.
          </p>
        </header>

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

        {posePipeline.poseState.errorMessage && (
          <p className={styles.poseError} role="status">
            Pose detection unavailable: {posePipeline.poseState.errorMessage}
          </p>
        )}

        <section className={styles.recordingPanel} aria-label="Local recording controls">
          <div className={styles.recordingStatus}>
            <p className={styles.panelLabel}>Local recording</p>
            <p className={styles.timer}>{formatElapsedTime(localRecording.elapsedSeconds)}</p>
            <p className={styles.statusText}>{captureViewState.primaryStatusText}</p>
          </div>

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
            <video className={styles.recordedVideo} src={localRecording.recordedVideoUrl} controls />
          </section>
        )}
      </section>
    </main>
  );
}
