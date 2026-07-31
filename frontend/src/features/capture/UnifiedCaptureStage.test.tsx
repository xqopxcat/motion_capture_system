import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { buildPoseDatasetDraft } from "./buildPoseDatasetDraft";
import type {
  CaptureOperationToken,
  CaptureProductState,
  CaptureReviewSnapshot,
} from "./captureControllerTypes";
import { buildCapturePresentation } from "./captureStateMachine";
import { getCaptureStageMode } from "./captureStageMode";
import {
  createUnifiedCaptureStageActionModel,
  UnifiedCaptureStage,
} from "./UnifiedCaptureStage";

const token = (kind: CaptureOperationToken["kind"], id: number): CaptureOperationToken => ({ kind, id });

function snapshot(interruptionReason: string | null = null): CaptureReviewSnapshot {
  return Object.freeze({
    reviewToken: token("review", 3),
    recordingToken: token("recording", 2),
    recordingOriginMs: 100,
    durationMs: 1000,
    videoBlob: new Blob(["video"]),
    videoUrl: "blob:review",
    poseDraft: buildPoseDatasetDraft([]),
    title: "Review",
    interruptionReason,
    diagnosticSessionStartedAtMs: 0,
  });
}

const states: CaptureProductState[] = [
  { type: "PermissionRequired", reason: "not-requested", recoverable: true, safeMessage: "Enable camera." },
  { type: "RequestingPermission", operationToken: token("camera", 1), requestedDeviceId: null, facingMode: "user" },
  { type: "Preparing", operationToken: token("preparation", 1), cameraSessionId: 1, streamReady: false, videoReady: false, poseReady: false, stage: "camera", trackingError: null },
  { type: "Ready", cameraSessionId: 1 },
  { type: "Countdown", operationToken: token("countdown", 2), cameraSessionId: 1, deadlineMs: 3000, durationMs: 3000 },
  { type: "Recording", operationToken: token("recording", 2), cameraSessionId: 1, recordingOriginMs: 3000, stopRequested: false, interruptedBy: null },
  { type: "Reviewing", snapshot: snapshot() },
  { type: "Saving", operationToken: token("saving", 4), snapshot: snapshot(), substate: { stage: "Analyzing", progress: null }, resume: { completedArtifacts: new Set() } },
  { type: "Completed", recordId: "record-1" },
  { type: "Failed", stage: "device", safeMessage: "Camera lost.", retryable: true, recoveryTarget: "PermissionRequired", routeLeaveRequiresConfirmation: false },
];

function renderStage(state: CaptureProductState) {
  return renderToStaticMarkup(
    <UnifiedCaptureStage
      productState={state}
      presentation={buildCapturePresentation(state, state.type === "Countdown" ? 3 : null, 4)}
      cameraStream={null}
      cameraStatus={state.type === "Ready" || state.type === "Countdown" || state.type === "Recording" ? "ready" : "idle"}
      currentPoseResult={null}
      liveVideoElement={null}
      onLiveVideoElementChange={() => undefined}
      onPrimaryAction={() => undefined}
      onRetake={() => undefined}
      recordTitle=""
      onRecordTitleChange={() => undefined}
    />,
  );
}

describe("UnifiedCaptureStage", () => {
  it("maps every Product State to the approved stage mode", () => {
    expect(states.map((state) => [state.type, getCaptureStageMode(state)])).toEqual([
      ["PermissionRequired", "permission"],
      ["RequestingPermission", "permission"],
      ["Preparing", "preparing"],
      ["Ready", "live"],
      ["Countdown", "live"],
      ["Recording", "live"],
      ["Reviewing", "review"],
      ["Saving", "saving"],
      ["Completed", "completed"],
      ["Failed", "failed"],
    ]);
  });

  it.each(states.filter((state) => state.type === "Ready" || state.type === "Countdown" || state.type === "Recording"))(
    "$type renders the live surface without a review surface",
    (state) => {
      const markup = renderStage(state);
      expect(markup).toContain('data-testid="live-surface"');
      expect(markup).not.toContain('data-testid="review-surface"');
    },
  );

  it("keeps Countdown live and shows a non-announcing countdown overlay", () => {
    const markup = renderStage(states.find((state) => state.type === "Countdown")!);
    expect(markup).toContain("aria-hidden=\"true\">3");
    expect(markup).toContain("Cancel");
  });

  it("shows recording status and the stable Stop action", () => {
    const markup = renderStage(states.find((state) => state.type === "Recording")!);
    expect(markup).toContain("Recording status");
    expect(markup).toContain(">Stop</button>");
  });

  it("renders recorded review instead of live camera and keeps Save/Retake intents", () => {
    const state = { type: "Reviewing", snapshot: snapshot("Camera disconnected.") } as const;
    const markup = renderStage(state);
    expect(markup).toContain('data-testid="review-surface"');
    expect(markup).not.toContain('data-testid="live-surface"');
    expect(markup).toContain("Save Recording");
    expect(markup).toContain("Retake");
    expect(markup).toContain("Camera disconnected.");
  });

  it("disables review playback controls while Saving", () => {
    const markup = renderStage(states.find((state) => state.type === "Saving")!);
    expect(markup).toContain('data-stage-mode="saving"');
    expect(markup).toContain("disabled=\"\"");
    expect(markup).not.toContain(">Save Recording</button>");
  });

  it("shows View Record on Completed and Retry only for retryable Failed", () => {
    expect(renderStage(states.find((state) => state.type === "Completed")!)).toContain("View Record");
    expect(renderStage(states.find((state) => state.type === "Failed")!)).toContain(">Retry</button>");
    const failed: CaptureProductState = { type: "Failed", stage: "analysis", safeMessage: "Unavailable.", retryable: false, recoveryTarget: "none", routeLeaveRequiresConfirmation: false };
    expect(renderStage(failed)).not.toContain(">Retry</button>");
  });

  it("routes Save and Retake through controller-provided intents", () => {
    const onPrimary = vi.fn();
    const onRetake = vi.fn();
    const actions = createUnifiedCaptureStageActionModel(
      { type: "Reviewing", snapshot: snapshot() },
      onPrimary,
      onRetake,
    );
    actions.primary();
    actions.retake?.();
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(onRetake).toHaveBeenCalledOnce();
  });

  it("contains no legacy camera, recording, upload or close-preview controls", () => {
    const markup = states.map(renderStage).join(" ");
    ["Start Camera", "Stop Camera", "Start Recording", "Stop Recording", "Upload", "Close Preview", "Clear Preview"].forEach((label) => {
      expect(markup).not.toContain(label);
    });
  });
});
