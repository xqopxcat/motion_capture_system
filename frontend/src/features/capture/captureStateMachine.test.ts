import { describe, expect, it } from "vitest";
import type { CaptureOperationToken, CaptureProductState } from "./captureControllerTypes";
import { buildPoseDatasetDraft } from "./buildPoseDatasetDraft";
import {
  buildCapturePresentation,
  captureStateReducer,
  createPermissionRequiredState,
  DEFAULT_CAPTURE_COUNTDOWN_MS,
} from "./captureStateMachine";

const token = (kind: CaptureOperationToken["kind"], id: number): CaptureOperationToken => ({ kind, id });

function ready(): CaptureProductState {
  return { type: "Ready", cameraSessionId: 1 };
}

function reviewing(): CaptureProductState {
  return {
    type: "Reviewing",
    snapshot: Object.freeze({
      reviewToken: token("review", 3),
      recordingToken: token("recording", 2),
      recordingOriginMs: 0,
      durationMs: 1_500,
      videoBlob: new Blob(["video"]),
      videoUrl: "blob:review",
      poseDraft: buildPoseDatasetDraft([]),
      title: "Draft",
      interruptionReason: null,
      diagnosticSessionStartedAtMs: null,
    }),
  };
}

describe("captureStateReducer", () => {
  it("runs the permission, preparation, countdown and recording path", () => {
    const camera = token("camera", 1);
    const preparation = token("preparation", 1);
    const countdown = token("countdown", 2);
    const recording = token("recording", 3);
    let state = createPermissionRequiredState();
    state = captureStateReducer(state, { type: "ENABLE_CAMERA", token: camera });
    state = captureStateReducer(state, { type: "CAMERA_GRANTED", token: camera, cameraSessionId: 1 });
    state = captureStateReducer(state, { type: "PREPARATION_READY", token: preparation });
    state = captureStateReducer(state, {
      type: "RECORD",
      token: countdown,
      deadlineMs: 4000,
      durationMs: DEFAULT_CAPTURE_COUNTDOWN_MS,
    });
    state = captureStateReducer(state, {
      type: "COUNTDOWN_FINISHED",
      token: countdown,
      recordingToken: recording,
      originMs: 4000,
    });
    expect(state).toEqual({
      type: "Recording",
      operationToken: recording,
      cameraSessionId: 1,
      recordingOriginMs: 4000,
      stopRequested: false,
      interruptedBy: null,
    });
  });

  it("ignores invalid and stale events by identity", () => {
    const state = ready();
    expect(captureStateReducer(state, { type: "SAVE", token: token("saving", 1), title: "Session", resume: { completedArtifacts: new Set() } })).toBe(state);
    const requesting = captureStateReducer(createPermissionRequiredState(), {
      type: "ENABLE_CAMERA",
      token: token("camera", 1),
    });
    expect(captureStateReducer(requesting, {
      type: "CAMERA_GRANTED",
      token: token("camera", 2),
      cameraSessionId: 2,
    })).toBe(requesting);
  });

  it("guards repeated Record and Stop intents", () => {
    const countdown = captureStateReducer(ready(), {
      type: "RECORD",
      token: token("countdown", 1),
      deadlineMs: 3000,
      durationMs: 3000,
    });
    expect(captureStateReducer(countdown, {
      type: "RECORD",
      token: token("countdown", 2),
      deadlineMs: 4000,
      durationMs: 3000,
    })).toBe(countdown);
    const recording = captureStateReducer(countdown, {
      type: "COUNTDOWN_FINISHED",
      token: token("countdown", 1),
      recordingToken: token("recording", 2),
      originMs: 3000,
    });
    const stopping = captureStateReducer(recording, { type: "STOP" });
    expect(captureStateReducer(stopping, { type: "STOP" })).toBe(stopping);
  });

  it("cancels countdown and safely stops recording when hidden", () => {
    const countdown = captureStateReducer(ready(), {
      type: "RECORD",
      token: token("countdown", 1),
      deadlineMs: 3000,
      durationMs: 3000,
    });
    expect(captureStateReducer(countdown, { type: "PAGE_HIDDEN" }).type).toBe("Ready");
    const recording = captureStateReducer(countdown, {
      type: "COUNTDOWN_FINISHED",
      token: token("countdown", 1),
      recordingToken: token("recording", 2),
      originMs: 3000,
    });
    expect(captureStateReducer(recording, { type: "PAGE_HIDDEN" })).toMatchObject({
      type: "Recording",
      stopRequested: true,
      interruptedBy: "Page became hidden.",
    });
  });

  it("exposes route protection and only allows camera switching from Ready", () => {
    const switched = captureStateReducer(ready(), {
      type: "CAMERA_SWITCH",
      token: token("camera", 5),
      facingMode: "environment",
    });
    expect(switched).toMatchObject({
      type: "RequestingPermission",
      requestedDeviceId: null,
      facingMode: "environment",
    });
    expect(buildCapturePresentation(ready(), null, 0).canSwitchCamera).toBe(true);
  });

  it("freezes the edited title, rejects duplicate Save, and retains it after Ready confirmation", () => {
    const saving = captureStateReducer(reviewing(), {
      type: "SAVE",
      token: token("saving", 4),
      title: "Trimmed title",
      resume: { completedArtifacts: new Set() },
    });
    expect(saving).toMatchObject({ type: "Saving", snapshot: { title: "Trimmed title" } });
    expect(captureStateReducer(saving, {
      type: "SAVE",
      token: token("saving", 5),
      title: "Duplicate",
      resume: { completedArtifacts: new Set() },
    })).toBe(saving);
    expect(captureStateReducer(saving, {
      type: "SAVE_SUCCEEDED",
      token: token("saving", 4),
      recordId: "record-1",
    })).toEqual({ type: "Completed", recordId: "record-1", title: "Trimmed title" });
  });

  it("activates navigation protection for unsaved review and active saving", () => {
    expect(buildCapturePresentation(reviewing(), null, 0).routeLeaveProtection).toBe("confirm-unsaved");
    const saving = captureStateReducer(reviewing(), {
      type: "SAVE",
      token: token("saving", 4),
      title: "Session",
      resume: { completedArtifacts: new Set() },
    });
    expect(buildCapturePresentation(saving, null, 0).routeLeaveProtection).toBe("blocked-saving");
  });
});
