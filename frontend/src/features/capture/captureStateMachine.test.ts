import { describe, expect, it } from "vitest";
import type { CaptureOperationToken, CaptureProductState } from "./captureControllerTypes";
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
    expect(captureStateReducer(state, { type: "SAVE", token: token("saving", 1), resume: { completedArtifacts: new Set() } })).toBe(state);
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
      deviceId: "rear",
    });
    expect(switched).toMatchObject({ type: "RequestingPermission", requestedDeviceId: "rear" });
    expect(buildCapturePresentation(ready(), null, 0).canSwitchCamera).toBe(true);
  });
});

