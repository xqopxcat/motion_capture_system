import { useEffect, useState, type CSSProperties } from "react";
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
import type { CapturePoseDisplayFrame } from "./usePosePipeline";

export type UnifiedCaptureStageProps = {
  productState: CaptureProductState;
  presentation: CapturePresentationModel;
  cameraStream: MediaStream | null;
  cameraStatus: CameraStreamStatus;
  cameraErrorMessage?: string | null;
  currentPoseResult: PoseDetectionResult | null;
  currentDisplayFrame: CapturePoseDisplayFrame | null;
  liveVideoElement: HTMLVideoElement | null;
  onLiveVideoElementChange: (videoElement: HTMLVideoElement | null) => void;
  onPrimaryAction: () => void;
  onRetake: () => void;
  recordTitle: string;
  onRecordTitleChange: (title: string) => void;
  cameraFacingMode: "user" | "environment";
  onFlipCamera: () => void;
  skeletonVisible: boolean;
  onSkeletonVisibilityChange: (visible: boolean) => void;
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

function stateBadgeLabel(state: CaptureProductState["type"]) {
  return ({
    PermissionRequired: "Permission",
    RequestingPermission: "Permission",
    Preparing: "Preparing",
    Ready: "Ready",
    Countdown: "Countdown",
    Recording: "REC",
    Reviewing: "Review",
    Saving: "Saving",
    Completed: "Complete",
    Failed: "Attention",
  } as const)[state];
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
  currentDisplayFrame,
  liveVideoElement,
  onLiveVideoElementChange,
  onPrimaryAction,
  onRetake,
  recordTitle,
  onRecordTitleChange,
  cameraFacingMode,
  onFlipCamera,
  skeletonVisible,
  onSkeletonVisibilityChange,
}: UnifiedCaptureStageProps) {
  const [liveVideoAspectRatio, setLiveVideoAspectRatio] = useState(16 / 9);

  useEffect(() => {
    if (!cameraStream) setLiveVideoAspectRatio(16 / 9);
  }, [cameraStream]);
  const mode = getCaptureStageMode(productState);
  const snapshot = reviewSnapshot(productState);
  const showsLiveSurface = mode === "live" || (mode === "preparing" && cameraStream !== null);
  const showsReviewSurface = (mode === "review" || mode === "saving") && snapshot !== null;
  const actionLabel = primaryActionLabel(presentation.primaryAction);
  const displayedActionLabel = presentation.failure?.recoveryActionLabel ?? actionLabel;

  return (
    <section
      className={styles.stage}
      aria-busy={productState.type === "Preparing" || productState.type === "Saving"}
      aria-label="Unified capture stage"
      data-layout="responsive-capture-workspace"
      data-stage-mode={mode}
    >
      <header className={styles.stageHeader}>
        <div>
          <p className={styles.eyebrow}>Capture</p>
          <h2 className={styles.title}>{presentation.statusLabel}</h2>
        </div>
        <span className={productState.type === "Recording" ? styles.recordingBadge : styles.stateBadge}>
          {stateBadgeLabel(productState.type)}
        </span>
      </header>

      <div className={styles.viewport}>
        {showsLiveSurface && (
          <div className={styles.liveSurface} data-testid="live-surface">
            <div
              className={styles.liveMediaFrame}
              data-testid="live-media-frame"
              style={{ "--live-video-aspect-ratio": liveVideoAspectRatio } as CSSProperties}
            >
              <CameraPreview
                stream={cameraStream}
                status={cameraStatus}
                errorMessage={cameraErrorMessage}
                onStart={onPrimaryAction}
                onStop={() => undefined}
                onVideoElementChange={onLiveVideoElementChange}
                onVideoDimensionsChange={(width, height) => setLiveVideoAspectRatio(width / height)}
                showControls={false}
              />
              <CaptureSkeletonOverlay
                displayFrame={currentDisplayFrame}
                poseResult={currentPoseResult}
                videoElement={liveVideoElement}
                visible={skeletonVisible}
              />
            </div>
          </div>
        )}

        {showsReviewSurface && snapshot && (
          <div className={styles.reviewSurface} data-testid="review-surface">
            <RecordedPosePreview
              poseDatasetDraft={snapshot.poseDraft}
              videoUrl={snapshot.videoUrl}
              disabled={mode === "saving"}
              skeletonVisible={skeletonVisible}
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
            {presentation.saving?.progressMode === "steps" ? (
              <span data-testid="saving-step-progress">
                {presentation.saving.completedSteps} of {presentation.saving.totalSteps} items saved
                {presentation.saving.currentStepLabel ? ` · ${presentation.saving.currentStepLabel}` : ""}
              </span>
            ) : (
              <span data-testid="saving-indeterminate">Working…</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.detailArea} data-testid="capture-detail-area">
        {snapshot?.interruptionReason && (mode === "review" || mode === "saving") && (
          <p className={styles.warning} role="status">{snapshot.interruptionReason}</p>
        )}

        {(mode === "review" || mode === "saving") && (
          <div className={styles.reviewDetails}>
            <span className={styles.duration}>Duration <strong>{presentation.review?.durationLabel}</strong></span>
            <label className={styles.titleField}>
              Record title
              <input
                value={recordTitle}
                onChange={(event) => onRecordTitleChange(event.currentTarget.value)}
                placeholder="Motion capture session"
                disabled={!presentation.review?.titleEditable}
              />
            </label>
          </div>
        )}

        {presentation.completed && (
          <div className={styles.resultPanel} role="status">
            <strong>Saved successfully</strong>
            <span>{presentation.completed.title}</span>
          </div>
        )}

        {presentation.failure && (
          <div className={styles.failurePanel} role="alert">
            <strong>{presentation.failure.title}</strong>
            <span>Stage: {presentation.failure.stageLabel}</span>
            <p>{presentation.failure.message}</p>
            {presentation.failure.recordId && <span>Your existing record will be reused.</span>}
          </div>
        )}

        <p className={styles.statusMessage} aria-live="polite">{presentation.statusMessage}</p>
      </div>

      <footer className={styles.actionArea} aria-label="Capture actions" data-testid="capture-action-area">
        {displayedActionLabel ? (
          <button
            className={productState.type === "Recording" ? styles.stopAction : styles.primaryAction}
            type="button"
            onClick={onPrimaryAction}
            disabled={!presentation.primaryActionEnabled}
          >
            {displayedActionLabel}
          </button>
        ) : (
          <span className={styles.actionPlaceholder} aria-hidden="true" />
        )}
        {productState.type === "Reviewing" && (
          <button className={styles.secondaryAction} type="button" onClick={onRetake}>
            Retake
          </button>
        )}
        {mode === "live" && (
          <button
            data-control="camera-flip"
            className={styles.utilityAction}
            type="button"
            onClick={onFlipCamera}
            disabled={!presentation.canSwitchCamera}
          >
            Flip Camera<span className={styles.srOnly}> ({cameraFacingMode})</span>
          </button>
        )}
        {(mode === "live" || mode === "review") && (
          <button
            aria-pressed={skeletonVisible}
            data-control="skeleton-toggle"
            className={styles.utilityAction}
            type="button"
            onClick={() => onSkeletonVisibilityChange(!skeletonVisible)}
          >
            Skeleton {skeletonVisible ? "On" : "Off"}
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
