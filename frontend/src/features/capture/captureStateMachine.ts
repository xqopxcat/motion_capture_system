import type {
  CaptureEvent,
  CaptureOperationToken,
  CapturePresentationModel,
  CaptureProductState,
} from "./captureControllerTypes";

export const DEFAULT_CAPTURE_COUNTDOWN_MS = 3000;

export function createPermissionRequiredState(
  reason: Extract<CaptureProductState, { type: "PermissionRequired" }>["reason"] =
    "not-requested",
): CaptureProductState {
  return {
    type: "PermissionRequired",
    reason,
    recoverable: reason !== "permission-denied",
    safeMessage:
      reason === "permission-denied"
        ? "Camera access is blocked. Update this site's browser permission, then return."
        : "Enable camera access when you are ready to capture.",
  };
}

function sameToken(
  current: CaptureOperationToken,
  candidate: CaptureOperationToken | undefined,
) {
  return Boolean(candidate && current.kind === candidate.kind && current.id === candidate.id);
}

export function captureStateReducer(
  state: CaptureProductState,
  event: CaptureEvent,
): CaptureProductState {
  switch (event.type) {
    case "ENTER_CAPTURE":
      if (event.permission === "granted") return state;
      return createPermissionRequiredState(
        event.permission === "denied" ? "permission-denied" : "permission-prompt-required",
      );
    case "ENABLE_CAMERA":
      if (state.type !== "PermissionRequired" && state.type !== "Failed") return state;
      return {
        type: "RequestingPermission",
        operationToken: event.token,
        requestedDeviceId: event.deviceId ?? null,
        facingMode: "user",
      };
    case "CAMERA_GRANTED":
      if (state.type !== "RequestingPermission" || !sameToken(state.operationToken, event.token)) {
        return state;
      }
      return {
        type: "Preparing",
        operationToken: { kind: "preparation", id: event.token.id },
        cameraSessionId: event.cameraSessionId,
        streamReady: true,
        videoReady: false,
        poseReady: false,
        stage: "video",
        trackingError: null,
      };
    case "CAMERA_REJECTED":
      if (state.type !== "RequestingPermission" || !sameToken(state.operationToken, event.token)) {
        return state;
      }
      return {
        type: "PermissionRequired",
        reason: event.reason,
        recoverable: event.recoverable,
        safeMessage: event.safeMessage,
      };
    case "PREPARATION_READY":
      if (state.type !== "Preparing" || !sameToken(state.operationToken, event.token)) return state;
      return { type: "Ready", cameraSessionId: state.cameraSessionId };
    case "PREPARATION_FAILED":
      if (state.type !== "Preparing" || !sameToken(state.operationToken, event.token)) return state;
      return {
        type: "Failed",
        stage: "preparation",
        safeMessage: event.safeMessage,
        retryable: true,
        recoveryTarget: "Preparing",
        routeLeaveRequiresConfirmation: false,
      };
    case "RECORD":
      if (state.type !== "Ready") return state;
      return {
        type: "Countdown",
        operationToken: event.token,
        cameraSessionId: state.cameraSessionId,
        deadlineMs: event.deadlineMs,
        durationMs: event.durationMs,
      };
    case "CANCEL_COUNTDOWN":
      if (
        state.type !== "Countdown" ||
        (event.token && !sameToken(state.operationToken, event.token))
      ) {
        return state;
      }
      return { type: "Ready", cameraSessionId: state.cameraSessionId };
    case "COUNTDOWN_FINISHED":
      if (state.type !== "Countdown" || !sameToken(state.operationToken, event.token)) return state;
      return {
        type: "Recording",
        operationToken: event.recordingToken,
        cameraSessionId: state.cameraSessionId,
        recordingOriginMs: event.originMs,
        stopRequested: false,
        interruptedBy: null,
      };
    case "STOP":
      if (state.type !== "Recording" || state.stopRequested) return state;
      return {
        ...state,
        stopRequested: true,
        interruptedBy: event.interruptionReason ?? state.interruptedBy,
      };
    case "RECORDING_READY":
      if (state.type !== "Recording" || !sameToken(state.operationToken, event.token)) return state;
      return { type: "Reviewing", snapshot: event.snapshot };
    case "RECORDING_FAILED":
      if (state.type !== "Recording" || !sameToken(state.operationToken, event.token)) return state;
      return {
        type: "Failed",
        stage: "recording",
        safeMessage: event.safeMessage,
        retryable: true,
        recoveryTarget: "Preparing",
        routeLeaveRequiresConfirmation: false,
      };
    case "RETAKE":
      if (state.type !== "Reviewing") return state;
      return {
        type: "Preparing",
        operationToken: event.token,
        cameraSessionId: event.token.id,
        streamReady: false,
        videoReady: false,
        poseReady: false,
        stage: "camera",
        trackingError: null,
      };
    case "SAVE":
      if (state.type !== "Reviewing") return state;
      return {
        type: "Saving",
        operationToken: event.token,
        snapshot: state.snapshot,
        substate: { stage: "Analyzing", progress: null },
        resume: event.resume,
      };
    case "SAVE_STAGE_CHANGED":
      if (state.type !== "Saving" || !sameToken(state.operationToken, event.token)) return state;
      return { ...state, substate: event.substate };
    case "SAVE_SUCCEEDED":
      if (state.type !== "Saving" || !sameToken(state.operationToken, event.token)) return state;
      return { type: "Completed", recordId: event.recordId };
    case "SAVE_FAILED":
      if (state.type !== "Saving" || !sameToken(state.operationToken, event.token)) return state;
      return {
        type: "Failed",
        stage: event.stage,
        safeMessage: event.safeMessage,
        retryable: event.retryable,
        recoveryTarget: event.recoveryTarget,
        reviewSnapshot: state.snapshot,
        recordId: event.resume.recordId,
        resume: event.resume,
        routeLeaveRequiresConfirmation: true,
      };
    case "RETRY":
      if (state.type !== "Failed" || !state.retryable) return state;
      if (state.recoveryTarget.startsWith("Saving") && state.reviewSnapshot && state.resume) {
        return {
          type: "Saving",
          operationToken: event.token,
          snapshot: state.reviewSnapshot,
          substate:
            state.recoveryTarget === "SavingFinalizing"
              ? { stage: "Finalizing", progress: null }
              : state.recoveryTarget === "SavingUploading"
                ? { stage: "UploadingArtifacts", artifact: null, progress: null }
                : { stage: "Analyzing", progress: null },
          resume: state.resume,
        };
      }
      if (state.recoveryTarget === "PermissionRequired") {
        return createPermissionRequiredState();
      }
      if (state.recoveryTarget === "Preparing" || state.recoveryTarget === "Ready") {
        return createPermissionRequiredState("not-requested");
      }
      return state;
    case "CAMERA_SWITCH":
      if (state.type !== "Ready") return state;
      return {
        type: "RequestingPermission",
        operationToken: event.token,
        requestedDeviceId: event.deviceId,
        facingMode: "user",
      };
    case "PAGE_HIDDEN":
      if (state.type === "Countdown") {
        return { type: "Ready", cameraSessionId: state.cameraSessionId };
      }
      if (state.type === "Recording" && !state.stopRequested) {
        return { ...state, stopRequested: true, interruptedBy: "Page became hidden." };
      }
      return state;
    case "TRACK_ENDED":
    case "DEVICE_LOST":
      if (state.type === "Recording" && !state.stopRequested) {
        return { ...state, stopRequested: true, interruptedBy: event.reason };
      }
      if (state.type === "Ready" || state.type === "Preparing" || state.type === "Countdown") {
        return {
          type: "Failed",
          stage: "device",
          safeMessage: event.reason,
          retryable: true,
          recoveryTarget: "PermissionRequired",
          routeLeaveRequiresConfirmation: false,
        };
      }
      return state;
    case "PAGE_VISIBLE":
    case "ROUTE_LEAVE_REQUESTED":
    case "UNMOUNT":
      return state;
    default:
      return state;
  }
}

export function buildCapturePresentation(
  state: CaptureProductState,
  countdownValue: number | null,
  recordingElapsedSeconds: number,
): CapturePresentationModel {
  const base = {
    productState: state.type,
    countdownValue,
    recordingElapsedSeconds,
    canSwitchCamera: state.type === "Ready",
    canUseOverlayControls:
      state.type === "Ready" || state.type === "Countdown" || state.type === "Recording",
  } as const;
  switch (state.type) {
    case "PermissionRequired":
      return { ...base, primaryAction: "enable-camera", primaryActionEnabled: state.recoverable, secondaryActions: ["back"], statusLabel: "Camera permission", statusMessage: state.safeMessage, routeLeaveProtection: "none" };
    case "RequestingPermission":
      return { ...base, primaryAction: "none", primaryActionEnabled: false, secondaryActions: ["back"], statusLabel: "Requesting camera", statusMessage: "Waiting for browser camera access.", routeLeaveProtection: "none" };
    case "Preparing":
      return { ...base, primaryAction: "none", primaryActionEnabled: false, secondaryActions: ["back"], statusLabel: "Preparing", statusMessage: `Preparing ${state.stage}.`, routeLeaveProtection: "none" };
    case "Ready":
      return { ...base, primaryAction: "record", primaryActionEnabled: true, secondaryActions: ["switch-camera"], statusLabel: "Ready", statusMessage: "Camera and pose tracking are ready.", routeLeaveProtection: "none" };
    case "Countdown":
      return { ...base, primaryAction: "cancel-countdown", primaryActionEnabled: true, secondaryActions: [], statusLabel: "Get ready", statusMessage: "Recording will begin after the countdown.", routeLeaveProtection: "none" };
    case "Recording":
      return { ...base, primaryAction: "stop", primaryActionEnabled: !state.stopRequested, secondaryActions: [], statusLabel: state.stopRequested ? "Finishing" : "Recording", statusMessage: state.stopRequested ? "Finishing the local recording." : "Recording video and raw pose.", routeLeaveProtection: "confirm-unsaved" };
    case "Reviewing":
      return { ...base, primaryAction: "save", primaryActionEnabled: true, secondaryActions: ["retake"], statusLabel: "Review", statusMessage: state.snapshot.interruptionReason ?? "Review the local recording before saving.", routeLeaveProtection: "confirm-unsaved" };
    case "Saving":
      return { ...base, primaryAction: "none", primaryActionEnabled: false, secondaryActions: [], statusLabel: state.substate.stage, statusMessage: state.substate.progress?.message ?? "Saving the Record.", routeLeaveProtection: "blocked-saving" };
    case "Completed":
      return { ...base, primaryAction: "view-record", primaryActionEnabled: true, secondaryActions: [], statusLabel: "Ready", statusMessage: "The Record is ready.", routeLeaveProtection: "none" };
    case "Failed":
      return { ...base, primaryAction: state.retryable ? "retry" : "none", primaryActionEnabled: state.retryable, secondaryActions: ["back"], statusLabel: "Needs attention", statusMessage: state.safeMessage, routeLeaveProtection: state.routeLeaveRequiresConfirmation ? "confirm-unsaved" : "none" };
  }
}
