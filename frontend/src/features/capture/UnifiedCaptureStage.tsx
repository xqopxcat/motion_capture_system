import type { PoseDetectionResult } from "../../engines/pose";
import type { CameraStreamStatus } from "../../hooks";
import { CameraPreview } from "../../components";
import type {
  CapturePresentationModel,
  CaptureProductState,
  CaptureReviewSnapshot,
} from "./captureControllerTypes";
import { getCaptureStageMode } from "./captureStageMode";
import { CaptureSkeletonOverlay } from "./CaptureSkeletonOverlay";
import { RecordedPosePreview } from "./RecordedPosePreview";
import styles from "./UnifiedCaptureStage.module.css";

export type UnifiedCaptureStageProps = {
  productState: CaptureProductState;
  presentation: CapturePresentationModel;
  cameraStream: MediaStream | null;
  cameraStatus: CameraStreamStatus;
  cameraErrorMessage?: string | null;
  currentPoseResult: PoseDetectionResult | null;
  liveVideoElement: HTMLVideoElement | null;
  onLiveVideoElementChange: (videoElement: HTMLVideoElement | null) => void;
  onPrimaryAction: () => void;
  onRetake: () => void;
  recordTitle: string;
  onRecordTitleChange: (title: string) => void;
};

function primaryActionLabel(action: CapturePresentationModel["primaryAction"]) {
  switch (action) {
    case "enable-camera": return "Enable Camera";
    case "record": return "Record";
    case "cancel-countdown": return "Cancel";
    case "stop": return "Stop";
    case "save": return "Save Recording";
    case "view-record": return "View Record";
    case "retry": return "Retry";
    default: return null;
  }
}
function reviewSnapshot(state: CaptureProductState): CaptureReviewSnapshot | null {
  if (state.type === "Reviewing" || state.type === "Saving") return state.snapshot;
  return null;
}

export function createUnifiedCaptureStageActionModel(
  state: CaptureProductState,
  onPrimaryAction: () => void,
  onRetake: () => void,
) {
  return {
    primary: onPrimaryAction,
    retake: state.type === "Reviewing" ? onRetake : null,
  };
}

export function UnifiedCaptureStage({
  productState,
  presentation,
  cameraStream,
  cameraStatus,
  cameraErrorMessage,
  currentPoseResult,
  liveVideoElement,
  onLiveVideoElementChange,
  onPrimaryAction,
  onRetake,
  recordTitle,
  onRecordTitleChange,
}: UnifiedCaptureStageProps) {
  const mode = getCaptureStageMode(productState);
  const snapshot = reviewSnapshot(productState);
  const showsLiveSurface = mode === "live" || (mode === "preparing" && cameraStream !== null);
  const showsReviewSurface = (mode === "review" || mode === "saving") && snapshot !== null;
  const actionLabel = primaryActionLabel(presentation.primaryAction);

  return (
    <section className={styles.stage} aria-label="Unified capture stage" data-stage-mode={mode}>
      <header className={styles.stageHeader}>
        <div>
          <p className={styles.eyebrow}>Capture</p>
          <h2 className={styles.title}>{presentation.statusLabel}</h2>
        </div>
        <span className={productState.type === "Recording" ? styles.recordingBadge : styles.stateBadge}>
          {productState.type === "Recording" ? "REC" : productState.type}
        </span>
      </header>

      <div className={styles.viewport}>
        {showsLiveSurface && (
          <div className={styles.liveSurface} data-testid="live-surface">
            <CameraPreview
              stream={cameraStream}
              status={cameraStatus}
              errorMessage={cameraErrorMessage}
              onStart={onPrimaryAction}
              onStop={() => undefined}
              onVideoElementChange={onLiveVideoElementChange}
              showControls={false}
            />
            <CaptureSkeletonOverlay
              poseResult={currentPoseResult}
              videoElement={liveVideoElement}
            />
          </div>
        )}

        {showsReviewSurface && snapshot && (
          <div className={styles.reviewSurface} data-testid="review-surface">
            <RecordedPosePreview
              poseDatasetDraft={snapshot.poseDraft}
              videoUrl={snapshot.videoUrl}
              disabled={mode === "saving"}
            />
          </div>
        )}

        {!showsLiveSurface && !showsReviewSurface && (
          <div className={styles.stateSurface} data-testid={`${mode}-surface`}>
            <p className={styles.stateTitle}>{presentation.statusLabel}</p>
            <p className={styles.stateMessage}>{presentation.statusMessage}</p>
            {productState.type === "PermissionRequired" && productState.reason === "permission-denied" && (
              <p className={styles.guidance}>Allow camera access in your browser site settings, then return to Capture.</p>
            )}
          </div>
        )}

        {productState.type === "Countdown" && (
          <div className={styles.countdownOverlay} aria-hidden="true">
            {presentation.countdownValue}
          </div>
        )}

        {productState.type === "Recording" && (
          <div className={styles.recordingOverlay} aria-label="Recording status">
            <span aria-hidden="true" className={styles.recordingDot} />
            <span>{presentation.statusLabel}</span>
            <time>{formatElapsedTime(presentation.recordingElapsedSeconds)}</time>
          </div>
        )}

        {mode === "saving" && (
          <div className={styles.savingOverlay} role="status">
            <strong>{presentation.statusLabel}</strong>
            <span>{presentation.statusMessage}</span>
          </div>
        )}
      </div>

      {snapshot?.interruptionReason && (mode === "review" || mode === "saving") && (
        <p className={styles.warning} role="status">{snapshot.interruptionReason}</p>
      )}

      {(mode === "review" || mode === "saving") && (
        <label className={styles.titleField}>
          Record title
          <input
            value={recordTitle}
            onChange={(event) => onRecordTitleChange(event.currentTarget.value)}
            placeholder="Motion capture session"
            disabled={mode === "saving"}
          />
        </label>
      )}

      <p className={styles.statusMessage} aria-live="polite">{presentation.statusMessage}</p>

      <footer className={styles.actionArea} aria-label="Capture actions">
        {actionLabel ? (
          <button
            className={productState.type === "Recording" ? styles.stopAction : styles.primaryAction}
            type="button"
            onClick={onPrimaryAction}
            disabled={!presentation.primaryActionEnabled}
          >
            {actionLabel}
          </button>
        ) : (
          <span className={styles.actionPlaceholder} aria-hidden="true" />
        )}
        {productState.type === "Reviewing" && (
          <button className={styles.secondaryAction} type="button" onClick={onRetake}>
            Retake
          </button>
        )}
      </footer>
    </section>
  );
}

function formatElapsedTime(elapsedSeconds: number) {
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
