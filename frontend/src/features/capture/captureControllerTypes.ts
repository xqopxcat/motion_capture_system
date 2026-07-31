import type { CapturePoseDatasetDraft } from "./buildPoseDatasetDraft";
import type {
  CapturePublishProgress,
  CapturePublishResumeState,
} from "./publishCaptureRecord";

export type CaptureOperationKind =
  | "camera"
  | "preparation"
  | "countdown"
  | "recording"
  | "review"
  | "saving"
  | "retry";

export type CaptureOperationToken = {
  kind: CaptureOperationKind;
  id: number;
};

export type CameraPermissionReason =
  | "not-requested"
  | "permission-prompt-required"
  | "permission-dismissed"
  | "permission-denied"
  | "device-unavailable";

export type CaptureReviewSnapshot = Readonly<{
  reviewToken: CaptureOperationToken;
  recordingToken: CaptureOperationToken;
  recordingOriginMs: number;
  durationMs: number;
  videoBlob: Blob;
  videoUrl: string;
  poseDraft: CapturePoseDatasetDraft;
  title: string;
  interruptionReason: string | null;
  diagnosticSessionStartedAtMs: number | null;
}>;

export type CaptureSavingSubstate =
  | { stage: "Analyzing"; progress: CapturePublishProgress | null }
  | { stage: "CreatingRecord"; progress: CapturePublishProgress | null }
  | {
      stage: "UploadingArtifacts";
      artifact: "video" | "pose" | "metrics" | "thumbnail" | null;
      progress: CapturePublishProgress | null;
    }
  | { stage: "Finalizing"; progress: CapturePublishProgress | null };

export type CaptureFailureStage =
  | "permission"
  | "preparation"
  | "recording"
  | "review-validation"
  | "analysis"
  | "record-creation"
  | "record-creation-ambiguous"
  | "upload"
  | "finalization"
  | "device";

export type CaptureRecoveryTarget =
  | "PermissionRequired"
  | "Preparing"
  | "Ready"
  | "Recording"
  | "SavingAnalyzing"
  | "SavingUploading"
  | "SavingFinalizing"
  | "none";

type PermissionRequiredState = {
  type: "PermissionRequired";
  reason: CameraPermissionReason;
  recoverable: boolean;
  safeMessage: string;
};

type RequestingPermissionState = {
  type: "RequestingPermission";
  operationToken: CaptureOperationToken;
  requestedDeviceId: string | null;
  facingMode: "user" | "environment";
};

type PreparingState = {
  type: "Preparing";
  operationToken: CaptureOperationToken;
  cameraSessionId: number;
  streamReady: boolean;
  videoReady: boolean;
  poseReady: boolean;
  stage: "camera" | "video" | "pose";
  trackingError: string | null;
};

type ReadyState = {
  type: "Ready";
  cameraSessionId: number;
};

type CountdownState = {
  type: "Countdown";
  operationToken: CaptureOperationToken;
  cameraSessionId: number;
  deadlineMs: number;
  durationMs: number;
};

type RecordingState = {
  type: "Recording";
  operationToken: CaptureOperationToken;
  cameraSessionId: number;
  recordingOriginMs: number;
  stopRequested: boolean;
  interruptedBy: string | null;
};

type ReviewingState = {
  type: "Reviewing";
  snapshot: CaptureReviewSnapshot;
};

type SavingState = {
  type: "Saving";
  operationToken: CaptureOperationToken;
  snapshot: CaptureReviewSnapshot;
  substate: CaptureSavingSubstate;
  resume: CapturePublishResumeState;
};

type CompletedState = {
  type: "Completed";
  recordId: string;
  title: string;
};

type FailedState = {
  type: "Failed";
  stage: CaptureFailureStage;
  safeMessage: string;
  retryable: boolean;
  recoveryTarget: CaptureRecoveryTarget;
  reviewSnapshot?: CaptureReviewSnapshot;
  recordId?: string;
  resume?: CapturePublishResumeState;
  routeLeaveRequiresConfirmation: boolean;
};

export type CaptureProductState =
  | PermissionRequiredState
  | RequestingPermissionState
  | PreparingState
  | ReadyState
  | CountdownState
  | RecordingState
  | ReviewingState
  | SavingState
  | CompletedState
  | FailedState;

type TokenEvent = { token: CaptureOperationToken };

export type CaptureEvent =
  | { type: "ENTER_CAPTURE"; permission: PermissionState | "unknown" }
  | { type: "ENABLE_CAMERA"; token: CaptureOperationToken; deviceId?: string | null }
  | ({ type: "CAMERA_GRANTED"; cameraSessionId: number } & TokenEvent)
  | ({
      type: "CAMERA_REJECTED";
      reason: CameraPermissionReason;
      safeMessage: string;
      recoverable: boolean;
    } & TokenEvent)
  | ({ type: "PREPARATION_READY" } & TokenEvent)
  | ({ type: "PREPARATION_FAILED"; safeMessage: string } & TokenEvent)
  | { type: "RECORD"; token: CaptureOperationToken; deadlineMs: number; durationMs: number }
  | ({ type: "CANCEL_COUNTDOWN" } & Partial<TokenEvent>)
  | ({ type: "COUNTDOWN_FINISHED"; recordingToken: CaptureOperationToken; originMs: number } & TokenEvent)
  | { type: "STOP"; interruptionReason?: string | null }
  | ({ type: "RECORDING_READY"; snapshot: CaptureReviewSnapshot } & TokenEvent)
  | ({ type: "RECORDING_FAILED"; safeMessage: string } & TokenEvent)
  | { type: "RETAKE"; token: CaptureOperationToken }
  | { type: "SAVE"; token: CaptureOperationToken; title: string; resume: CapturePublishResumeState }
  | ({ type: "SAVE_STAGE_CHANGED"; substate: CaptureSavingSubstate } & TokenEvent)
  | ({ type: "SAVE_SUCCEEDED"; recordId: string } & TokenEvent)
  | ({
      type: "SAVE_FAILED";
      stage: CaptureFailureStage;
      safeMessage: string;
      retryable: boolean;
      recoveryTarget: CaptureRecoveryTarget;
      resume: CapturePublishResumeState;
    } & TokenEvent)
  | { type: "RETRY"; token: CaptureOperationToken }
  | { type: "CAMERA_SWITCH"; token: CaptureOperationToken; deviceId: string }
  | { type: "PAGE_HIDDEN" }
  | { type: "PAGE_VISIBLE" }
  | { type: "TRACK_ENDED"; reason: string }
  | { type: "DEVICE_LOST"; reason: string }
  | { type: "ROUTE_LEAVE_REQUESTED" }
  | { type: "UNMOUNT" };

export type CapturePrimaryAction =
  | "enable-camera"
  | "record"
  | "cancel-countdown"
  | "stop"
  | "save"
  | "view-record"
  | "retry"
  | "none";

export type CapturePresentationModel = {
  productState: CaptureProductState["type"];
  primaryAction: CapturePrimaryAction;
  primaryActionEnabled: boolean;
  secondaryActions: Array<"retake" | "switch-camera" | "back">;
  statusLabel: string;
  statusMessage: string;
  countdownValue: number | null;
  recordingElapsedSeconds: number;
  canSwitchCamera: boolean;
  canUseOverlayControls: boolean;
  routeLeaveProtection: "none" | "confirm-unsaved" | "blocked-saving";
  review: {
    durationLabel: string;
    titleEditable: boolean;
    interruptionWarning: string | null;
  } | null;
  saving: {
    stageLabel: string;
    progressMode: "indeterminate" | "steps";
    completedSteps: number;
    totalSteps: number;
    currentStepLabel: string | null;
  } | null;
  completed: { recordId: string; title: string } | null;
  failure: {
    title: string;
    stageLabel: string;
    message: string;
    retryable: boolean;
    recordId: string | null;
    recoveryActionLabel: string | null;
  } | null;
};
