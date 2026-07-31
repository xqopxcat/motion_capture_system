import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useCameraStream } from "../../hooks/useCameraStream";
import { useMediaRecorder } from "../../hooks/useMediaRecorder";
import { buildPoseDatasetDraft } from "./buildPoseDatasetDraft";
import type {
  CaptureFailureStage,
  CaptureOperationKind,
  CaptureOperationToken,
  CaptureProductState,
  CaptureRecoveryTarget,
  CaptureReviewSnapshot,
  CaptureSavingSubstate,
} from "./captureControllerTypes";
import type {
  CapturePublishProgress,
  CapturePublishResumeState,
} from "./publishCaptureRecord";
import {
  buildCapturePresentation,
  captureStateReducer,
  createPermissionRequiredState,
  DEFAULT_CAPTURE_COUNTDOWN_MS,
} from "./captureStateMachine";
import { captureRuntimeInstrumentation } from "./instrumentation/captureRuntimeInstrumentation";
import { publishCaptureRecord } from "./publishCaptureRecord";
import { validateCaptureReviewCandidate } from "./captureReviewValidation";
import { usePoseFrameCollection } from "./usePoseFrameCollection";
import { usePosePipeline } from "./usePosePipeline";

export type CaptureControllerOptions = {
  countdownDurationMs?: number;
  now?: () => number;
};

function mediaTimestampMs(video: HTMLVideoElement | null) {
  return video && Number.isFinite(video.currentTime) ? video.currentTime * 1000 : 0;
}

export function mapPublishProgressToSavingSubstate(
  progress: CapturePublishProgress,
): CaptureSavingSubstate {
  switch (progress.stage) {
    case "preparing":
      return { stage: "Analyzing", progress };
    case "creating":
      return { stage: "CreatingRecord", progress };
    case "finalizing":
    case "ready":
      return { stage: "Finalizing", progress };
    default:
      return {
        stage: "UploadingArtifacts",
        artifact: progress.stage.replace("uploading-", "") as
          | "video"
          | "pose"
          | "metrics"
          | "thumbnail",
        progress,
      };
  }
}

export function classifySavingFailure(
  _error: unknown,
  resume: CapturePublishResumeState,
  substate: CaptureSavingSubstate = { stage: "Analyzing", progress: null },
): {
  stage: CaptureFailureStage;
  retryable: boolean;
  recoveryTarget: CaptureRecoveryTarget;
  safeMessage: string;
} {
  if (resume.creationOutcomeAmbiguous) {
    return {
      stage: "record-creation-ambiguous",
      retryable: false,
      recoveryTarget: "none",
      safeMessage:
        "Record creation may have succeeded, but its identity could not be confirmed. To avoid a duplicate Record, automatic retry is disabled.",
    };
  }
  if (!resume.recordId) {
    const creating = substate.stage === "CreatingRecord";
    return {
      stage: creating ? "record-creation" : "analysis",
      retryable: true,
      recoveryTarget: "SavingAnalyzing",
      safeMessage: creating
        ? "We couldn't create the record. Your local recording is still available and can be retried safely."
        : "We couldn't prepare the motion analysis. Your local recording is still available and can be retried safely.",
    };
  }
  const finalizing = substate.stage === "Finalizing" || resume.lifecycleFailed === true;
  return {
    stage: finalizing ? "finalization" : "upload",
    retryable: true,
    recoveryTarget: finalizing ? "SavingFinalizing" : "SavingUploading",
    safeMessage: finalizing
      ? "Your record exists and completed uploads are preserved. Final confirmation can be retried without creating another record."
      : "Saving was interrupted. Your record and completed uploads are preserved; retry will continue from the next safe step.",
  };
}

export function normalizeCaptureTitle(draft: string, snapshotTitle: string, date = new Date()) {
  return draft.trim() || snapshotTitle.trim() || `Motion Capture ${date.toLocaleString()}`;
}

export function shouldPreventCaptureUnload(routeLeaveRequiresConfirmation: boolean) {
  return routeLeaveRequiresConfirmation;
}

export function useCaptureController(options: CaptureControllerOptions = {}) {
  const now = options.now ?? (() => performance.now());
  const countdownDurationMs = options.countdownDurationMs ?? DEFAULT_CAPTURE_COUNTDOWN_MS;
  const [productState, dispatch] = useReducer(
    captureStateReducer,
    undefined,
    () => createPermissionRequiredState(),
  );
  const stateRef = useRef<CaptureProductState>(productState);
  const tokenSequenceRef = useRef(0);
  const mountedRef = useRef(true);
  const countdownTimeoutRef = useRef<number | null>(null);
  const saveStartedTokenRef = useRef<number | null>(null);
  const savingSubstateRef = useRef<CaptureSavingSubstate>({ stage: "Analyzing", progress: null });
  const reviewCreatedForRecordingRef = useRef<number | null>(null);
  const [previewVideoElement, setPreviewVideoElement] = useState<HTMLVideoElement | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [videoReadinessRevision, setVideoReadinessRevision] = useState(0);
  const [recordTitle, setRecordTitle] = useState("");
  const camera = useCameraStream();
  const recorder = useMediaRecorder(camera.stream);
  const pose = usePosePipeline();
  const poseCollection = usePoseFrameCollection();

  stateRef.current = productState;

  const newToken = useCallback((kind: CaptureOperationKind): CaptureOperationToken => {
    tokenSequenceRef.current += 1;
    return { kind, id: tokenSequenceRef.current };
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    setCountdownValue(null);
  }, []);

  const requestCamera = useCallback(
    (deviceId?: string | null) => {
      const current = stateRef.current;
      if (current.type !== "PermissionRequired" && current.type !== "Ready") return;
      const token = newToken("camera");
      dispatch(
        current.type === "Ready" && deviceId
          ? { type: "CAMERA_SWITCH", token, deviceId }
          : { type: "ENABLE_CAMERA", token, deviceId },
      );
      void camera.startCamera({ deviceId: deviceId ?? undefined });
    },
    [camera, newToken],
  );

  useEffect(() => {
    if (!previewVideoElement) return;
    const markReady = () => setVideoReadinessRevision((value) => value + 1);
    previewVideoElement.addEventListener("loadedmetadata", markReady);
    previewVideoElement.addEventListener("canplay", markReady);
    return () => {
      previewVideoElement.removeEventListener("loadedmetadata", markReady);
      previewVideoElement.removeEventListener("canplay", markReady);
    };
  }, [previewVideoElement]);

  useEffect(() => {
    let active = true;
    const enter = async () => {
      let permission: PermissionState | "unknown" = "unknown";
      try {
        if (navigator.permissions?.query) {
          permission = (await navigator.permissions.query({ name: "camera" as PermissionName })).state;
        }
      } catch {
        permission = "unknown";
      }
      if (!active) return;
      dispatch({ type: "ENTER_CAPTURE", permission });
      if (permission === "granted") {
        const token = newToken("camera");
        dispatch({ type: "ENABLE_CAMERA", token });
        void camera.startCamera();
      }
    };
    void enter();
    return () => {
      active = false;
    };
  }, []); // Route-entry policy intentionally runs once.

  useEffect(() => {
    const state = stateRef.current;
    if (state.type !== "RequestingPermission") return;
    if (camera.status === "ready" && camera.stream) {
      dispatch({ type: "CAMERA_GRANTED", token: state.operationToken, cameraSessionId: state.operationToken.id });
      return;
    }
    if (camera.status === "permission-denied" || camera.status === "error" || camera.status === "unsupported") {
      dispatch({
        type: "CAMERA_REJECTED",
        token: state.operationToken,
        reason:
          camera.status === "permission-denied"
            ? "permission-denied"
            : camera.status === "error"
              ? "device-unavailable"
              : "not-requested",
        safeMessage: camera.errorMessage ?? "Camera could not be prepared.",
        recoverable: camera.status !== "unsupported",
      });
    }
  }, [camera.errorMessage, camera.status, camera.stream]);

  useEffect(() => {
    if (productState.type !== "Preparing" || !camera.stream) return;
    void pose.initializePosePipeline();
  }, [camera.stream, pose.initializePosePipeline, productState.type]);

  useEffect(() => {
    if (
      productState.type === "Preparing" &&
      camera.status === "ready" &&
      previewVideoElement &&
      previewVideoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      pose.poseState.status === "ready"
    ) {
      dispatch({ type: "PREPARATION_READY", token: productState.operationToken });
    } else if (productState.type === "Preparing" && pose.poseState.status === "error") {
      dispatch({
        type: "PREPARATION_FAILED",
        token: productState.operationToken,
        safeMessage: pose.poseState.errorMessage ?? "Pose tracking could not be prepared.",
      });
    }
  }, [camera.status, pose.poseState, previewVideoElement, productState, videoReadinessRevision]);

  useEffect(() => {
    if (
      (productState.type === "Ready" ||
        productState.type === "Countdown" ||
        productState.type === "Recording") &&
      previewVideoElement
    ) {
      pose.startPoseDetection(previewVideoElement);
    } else {
      pose.stopPoseDetection();
    }
  }, [pose.startPoseDetection, pose.stopPoseDetection, previewVideoElement, productState.type]);

  useEffect(() => {
    if (productState.type === "Recording") {
      poseCollection.collectPoseFrame(pose.currentPoseResult);
    }
  }, [pose.currentPoseResult, poseCollection.collectPoseFrame, productState.type]);

  const startCountdown = useCallback(() => {
    const current = stateRef.current;
    if (current.type !== "Ready" || countdownTimeoutRef.current !== null) return;
    const token = newToken("countdown");
    const deadlineMs = now() + countdownDurationMs;
    dispatch({ type: "RECORD", token, deadlineMs, durationMs: countdownDurationMs });
    setCountdownValue(Math.ceil(countdownDurationMs / 1000));
    const tick = () => {
      const remainingMs = deadlineMs - now();
      if (remainingMs > 0 && stateRef.current.type === "Countdown") {
        setCountdownValue(Math.ceil(remainingMs / 1000));
        countdownTimeoutRef.current = window.setTimeout(tick, Math.min(100, remainingMs));
        return;
      }
      countdownTimeoutRef.current = null;
      if (stateRef.current.type !== "Countdown") return;
      const recordingToken = newToken("recording");
      const originMs = now();
      dispatch({ type: "COUNTDOWN_FINISHED", token, recordingToken, originMs });
      poseCollection.startPoseFrameCollection(mediaTimestampMs(previewVideoElement));
      recorder.startRecording({ operationId: recordingToken.id, originMs });
      setCountdownValue(null);
    };
    countdownTimeoutRef.current = window.setTimeout(tick, Math.min(100, countdownDurationMs));
  }, [countdownDurationMs, newToken, now, poseCollection.startPoseFrameCollection, previewVideoElement, recorder.startRecording]);

  const cancelCountdown = useCallback(() => {
    const current = stateRef.current;
    if (current.type !== "Countdown") return;
    clearCountdown();
    dispatch({ type: "CANCEL_COUNTDOWN", token: current.operationToken });
  }, [clearCountdown]);

  const stopRecording = useCallback((interruptionReason?: string | null) => {
    const current = stateRef.current;
    if (current.type !== "Recording" || current.stopRequested) return;
    dispatch({ type: "STOP", interruptionReason });
    poseCollection.stopPoseFrameCollection();
    recorder.stopRecording();
  }, [poseCollection.stopPoseFrameCollection, recorder.stopRecording]);

  useEffect(() => {
    if (
      productState.type !== "Recording" ||
      !productState.stopRequested ||
      recorder.status !== "recorded" ||
      !recorder.recordedBlob ||
      !recorder.recordedVideoUrl ||
      reviewCreatedForRecordingRef.current === productState.operationToken.id
    ) {
      return;
    }
    reviewCreatedForRecordingRef.current = productState.operationToken.id;
    const poseDraft = buildPoseDatasetDraft(poseCollection.getCollectedPoseFrames());
    const snapshot: CaptureReviewSnapshot = Object.freeze({
      reviewToken: newToken("review"),
      recordingToken: productState.operationToken,
      recordingOriginMs: productState.recordingOriginMs,
      durationMs: recorder.recordedDurationMs,
      videoBlob: recorder.recordedBlob,
      videoUrl: recorder.recordedVideoUrl,
      poseDraft,
      title: recordTitle,
      interruptionReason: productState.interruptedBy,
      diagnosticSessionStartedAtMs: captureRuntimeInstrumentation.snapshot().sessionStartedAtMs,
    });
    const validation = validateCaptureReviewCandidate(snapshot);
    if (!validation.valid) {
      dispatch({
        type: "RECORDING_FAILED",
        token: productState.operationToken,
        safeMessage: `Recording cannot be reviewed (${validation.errors.join(", ")}).`,
      });
      return;
    }
    dispatch({ type: "RECORDING_READY", token: productState.operationToken, snapshot });
    pose.stopPoseDetection();
    pose.disposePosePipeline();
    camera.stopCamera();
  }, [camera.stopCamera, newToken, pose.disposePosePipeline, pose.stopPoseDetection, poseCollection.getCollectedPoseFrames, productState, recordTitle, recorder]);

  useEffect(() => {
    if (productState.type === "Recording" && productState.stopRequested && recorder.status === "error") {
      dispatch({
        type: "RECORDING_FAILED",
        token: productState.operationToken,
        safeMessage: recorder.errorMessage ?? "Recording failed.",
      });
    }
  }, [productState, recorder.errorMessage, recorder.status]);

  useEffect(() => {
    if (productState.type !== "Failed") return;
    if (!productState.reviewSnapshot) {
      poseCollection.stopPoseFrameCollection();
      pose.stopPoseDetection();
      pose.disposePosePipeline();
      camera.stopCamera();
    }
  }, [camera.stopCamera, pose.disposePosePipeline, pose.stopPoseDetection, poseCollection.stopPoseFrameCollection, productState]);

  const retake = useCallback(() => {
    if (stateRef.current.type !== "Reviewing") return;
    recorder.resetRecordingResult();
    setRecordTitle("");
    const token = newToken("preparation");
    dispatch({ type: "RETAKE", token });
    void camera.startCamera();
  }, [camera.startCamera, newToken, recorder.resetRecordingResult]);

  const save = useCallback(() => {
    const current = stateRef.current;
    if (current.type !== "Reviewing") return;
    const title = normalizeCaptureTitle(recordTitle, current.snapshot.title);
    setRecordTitle(title);
    const token = newToken("saving");
    dispatch({
      type: "SAVE",
      token,
      title,
      resume: { completedArtifacts: new Set() },
    });
  }, [newToken, recordTitle]);

  useEffect(() => {
    if (
      productState.type !== "Saving" ||
      saveStartedTokenRef.current === productState.operationToken.id
    ) {
      return;
    }
    saveStartedTokenRef.current = productState.operationToken.id;
    const token = productState.operationToken;
    const resume = productState.resume;
    void publishCaptureRecord({
      title: productState.snapshot.title,
      description: "Captured and analyzed in the browser.",
      videoBlob: productState.snapshot.videoBlob,
      poseDraft: productState.snapshot.poseDraft,
      resume,
      onProgress: (progress) => {
        if (!mountedRef.current) return;
        savingSubstateRef.current = mapPublishProgressToSavingSubstate(progress);
        dispatch({
          type: "SAVE_STAGE_CHANGED",
          token,
          substate: savingSubstateRef.current,
        });
      },
    })
      .then((result) => {
        if (mountedRef.current) dispatch({ type: "SAVE_SUCCEEDED", token, recordId: result.recordId });
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        dispatch({ type: "SAVE_FAILED", token, resume, ...classifySavingFailure(error, resume, savingSubstateRef.current) });
      });
  }, [productState]);

  const retry = useCallback(() => {
    const current = stateRef.current;
    if (current.type !== "Failed" || !current.retryable) return;
    const token = newToken("retry");
    dispatch({ type: "RETRY", token });
  }, [newToken]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        const current = stateRef.current;
        if (current.type === "Countdown") clearCountdown();
        if (current.type === "Recording" && !current.stopRequested) {
          poseCollection.stopPoseFrameCollection();
          recorder.stopRecording();
        }
        dispatch({ type: "PAGE_HIDDEN" });
      } else {
        dispatch({ type: "PAGE_VISIBLE" });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [clearCountdown, poseCollection.stopPoseFrameCollection, recorder.stopRecording]);

  useEffect(() => {
    const track = camera.stream?.getVideoTracks()[0];
    if (!track) return;
    const onEnded = () => {
      const current = stateRef.current;
      if (current.type === "Recording" && !current.stopRequested) {
        poseCollection.stopPoseFrameCollection();
        recorder.stopRecording();
      }
      dispatch({ type: "TRACK_ENDED", reason: "The active camera track ended." });
    };
    track.addEventListener("ended", onEnded);
    return () => track.removeEventListener("ended", onEnded);
  }, [camera.stream, poseCollection.stopPoseFrameCollection, recorder.stopRecording]);

  const presentation = useMemo(
    () => buildCapturePresentation(productState, countdownValue, recorder.elapsedSeconds),
    [countdownValue, productState, recorder.elapsedSeconds],
  );
  const routeLeaveRequiresConfirmation = presentation.routeLeaveProtection !== "none";

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldPreventCaptureUnload(routeLeaveRequiresConfirmation)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [routeLeaveRequiresConfirmation]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearCountdown();
      tokenSequenceRef.current += 1;
      poseCollection.stopPoseFrameCollection();
      pose.stopPoseDetection();
      pose.disposePosePipeline();
      recorder.stopRecording();
      camera.stopCamera();
      dispatch({ type: "UNMOUNT" });
    };
  }, []);

  const primaryAction = useCallback(() => {
    switch (stateRef.current.type) {
      case "PermissionRequired": requestCamera(); break;
      case "Ready": startCountdown(); break;
      case "Countdown": cancelCountdown(); break;
      case "Recording": stopRecording(); break;
      case "Reviewing": save(); break;
      case "Failed": retry(); break;
    }
  }, [cancelCountdown, requestCamera, retry, save, startCountdown, stopRecording]);

  return {
    productState,
    presentation,
    routeLeaveRequiresConfirmation,
    primaryAction,
    requestCamera,
    startCountdown,
    cancelCountdown,
    stopRecording,
    retake,
    save,
    retry,
    recordTitle,
    setRecordTitle,
    cameraPreview: { ...camera, onVideoElementChange: setPreviewVideoElement },
    currentPoseResult: pose.currentPoseResult,
    localRecording: recorder,
    poseDatasetDraft: productState.type === "Reviewing" ? productState.snapshot.poseDraft : null,
    poseFrameCollection: poseCollection,
    posePipeline: pose,
    previewVideoElement,
  };
}
