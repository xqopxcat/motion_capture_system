import { useNavigate } from "react-router-dom";
import { CameraPreview } from "../../components";
import {
  CaptureDiagnosticsPanel,
  CaptureSkeletonOverlay,
  RecordedPosePreview,
} from "../../features/capture";
import { captureRuntimeInstrumentation } from "../../features/capture/instrumentation/captureRuntimeInstrumentation";
import { useCapturePipeline } from "../../hooks";
import styles from "./CapturePage.module.css";

function formatElapsedTime(elapsedSeconds: number) {
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function primaryActionLabel(action: ReturnType<typeof useCapturePipeline>["presentation"]["primaryAction"]) {
  switch (action) {
    case "enable-camera": return "Enable Camera";
    case "record": return "Record";
    case "cancel-countdown": return "Cancel";
    case "stop": return "Stop";
    case "save": return "Save Recording";
    case "view-record": return "View Record";
    case "retry": return "Retry";
    default: return "Please wait";
  }
}

export function CapturePage() {
  captureRuntimeInstrumentation.recordReactRender("CapturePage");
  const navigate = useNavigate();
  const controller = useCapturePipeline();
  const {
    cameraPreview,
    currentPoseResult,
    localRecording,
    poseFrameCollection,
    posePipeline,
    presentation,
    previewVideoElement,
    productState,
  } = controller;
  const reviewingSnapshot = productState.type === "Reviewing" ? productState.snapshot : null;

  const runPrimaryAction = () => {
    if (productState.type === "Completed") {
      navigate(`/records/${encodeURIComponent(productState.recordId)}`);
      return;
    }
    controller.primaryAction();
  };

  return (
    <main className={styles.capturePage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Motion Capture</p>
          <h1 className={styles.title}>Capture</h1>
          <p className={styles.description}>
            Record a movement sample locally, review it, and save a production Record.
          </p>
        </header>

        <CaptureDiagnosticsPanel />

        <section className={styles.captureWorkspace} aria-label="Capture workspace">
          <div className={styles.livePanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>Capture state</p>
                <h2 className={styles.sectionTitle}>{presentation.statusLabel}</h2>
              </div>
              <span className={productState.type === "Recording" ? styles.statusRecording : styles.statusIdle}>
                {productState.type}
              </span>
            </div>

            <div className={styles.previewContainer}>
              <CameraPreview
                stream={cameraPreview.stream}
                status={cameraPreview.status}
                errorMessage={cameraPreview.errorMessage}
                onStart={() => controller.requestCamera()}
                onStop={cameraPreview.stopCamera}
                onVideoElementChange={cameraPreview.onVideoElementChange}
                showControls={false}
              />
              <CaptureSkeletonOverlay poseResult={currentPoseResult} videoElement={previewVideoElement} />
              {productState.type === "Countdown" && (
                <output aria-live="assertive">{presentation.countdownValue}</output>
              )}
            </div>
          </div>

          <section className={styles.recordingPanel} aria-label="Capture session controls">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>Session</p>
                <h2 className={styles.sectionTitle}>{presentation.statusLabel}</h2>
              </div>
            </div>

            <div className={styles.recordingStatus}>
              <div className={styles.recordingPrimaryStatus}>
                <p className={styles.timer}>{formatElapsedTime(presentation.recordingElapsedSeconds)}</p>
                <p className={styles.statusText}>{presentation.statusMessage}</p>
              </div>
              <div className={styles.recordingSecondaryStatus}>
                <p className={styles.panelLabel}>Pose data</p>
                <p className={styles.statusText}>
                  {posePipeline.poseState.status} · {poseFrameCollection.collectedPoseFrameCount} frames
                </p>
              </div>
            </div>

            <div className={styles.recordingActions}>
              <button
                className={productState.type === "Recording" ? styles.stopAction : styles.recordAction}
                type="button"
                onClick={runPrimaryAction}
                disabled={!presentation.primaryActionEnabled}
              >
                {primaryActionLabel(presentation.primaryAction)}
              </button>
              {productState.type === "Reviewing" && (
                <button className={styles.secondaryAction} type="button" onClick={controller.retake}>
                  Retake
                </button>
              )}
            </div>
          </section>
        </section>

        {reviewingSnapshot && (
          <section className={styles.recordedPreview} aria-label="Recorded video preview">
            <div className={styles.recordedPreviewHeader}>
              <div>
                <p className={styles.panelLabel}>Recorded preview</p>
                <h2 className={styles.previewTitle}>Review local recording</h2>
              </div>
            </div>
            {reviewingSnapshot.interruptionReason && (
              <p className={styles.error} role="status">{reviewingSnapshot.interruptionReason}</p>
            )}
            <RecordedPosePreview
              poseDatasetDraft={reviewingSnapshot.poseDraft}
              videoUrl={reviewingSnapshot.videoUrl}
            />
            <section className={styles.publishPanel} aria-label="Save production Record">
              <label className={styles.publishLabel}>
                Record title
                <input
                  value={controller.recordTitle}
                  onChange={(event) => controller.setRecordTitle(event.target.value)}
                  placeholder="Motion capture session"
                />
              </label>
            </section>
          </section>
        )}

        {productState.type === "Failed" && (
          <p className={styles.error} role="alert">{productState.safeMessage}</p>
        )}
      </section>
    </main>
  );
}
