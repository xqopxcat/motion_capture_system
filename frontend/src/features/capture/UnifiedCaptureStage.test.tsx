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
  { type: "Completed", recordId: "record-1", title: "Sprint session" },
  { type: "Failed", stage: "device", safeMessage: "Camera lost.", retryable: true, recoveryTarget: "PermissionRequired", routeLeaveRequiresConfirmation: false },
];

function renderStage(state: CaptureProductState, skeletonVisible = true, anglesVisible = false) {
  return renderToStaticMarkup(
    <UnifiedCaptureStage
      productState={state}
      presentation={buildCapturePresentation(state, state.type === "Countdown" ? 3 : null, 4)}
      cameraStream={null}
      cameraStatus={state.type === "Ready" || state.type === "Countdown" || state.type === "Recording" ? "ready" : "idle"}
      currentFilteredPose={null}
      currentDisplayFrame={null}
      liveVideoElement={null}
      onLiveVideoElementChange={() => undefined}
      onPrimaryAction={() => undefined}
      onRetake={() => undefined}
      recordTitle=""
      onRecordTitleChange={() => undefined}
      cameraFacingMode="user"
      onFlipCamera={() => undefined}
      skeletonVisible={skeletonVisible}
      onSkeletonVisibilityChange={() => undefined}
      anglesVisible={anglesVisible}
      onAnglesVisibilityChange={() => undefined}
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

  it("keeps a single responsive workspace with stable detail and action regions", () => {
    const markup = renderStage(states.find((state) => state.type === "Reviewing")!);
    expect(markup).toContain('data-layout="responsive-capture-workspace"');
    expect(markup).toContain('data-testid="capture-detail-area"');
    expect(markup).toContain('data-testid="capture-action-area"');
  });

  it.each(states.filter((state) => state.type === "Ready" || state.type === "Countdown" || state.type === "Recording"))(
    "$type renders the live surface without a review surface",
    (state) => {
      const markup = renderStage(state);
      expect(markup).toContain('data-testid="live-surface"');
      expect(markup).toContain('data-testid="live-media-frame"');
      expect(markup).toContain('--live-video-aspect-ratio:1.7777777777777777');
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
    expect(markup).toContain("Flip Camera");
    expect(markup).toContain("Skeleton On");
  });

  it("exposes display-only skeleton controls in Live and Review", () => {
    const live = renderStage(states.find((state) => state.type === "Ready")!);
    const review = renderStage(states.find((state) => state.type === "Reviewing")!);
    expect(live).toContain('data-control="skeleton-toggle"');
    expect(live).toContain('aria-pressed="true"');
    expect(review).toContain('data-control="skeleton-toggle"');
    expect(review).not.toContain('data-control="camera-flip"');
    expect(live).toContain('data-control="angles-toggle"');
    expect(live).toContain("Angles Off");
    expect(review).toContain('data-control="angles-toggle"');
  });

  it.each([
    [true, true, "Skeleton On", "Angles On"],
    [true, false, "Skeleton On", "Angles Off"],
    [false, true, "Skeleton Off", "Angles On"],
    [false, false, "Skeleton Off", "Angles Off"],
  ] as const)("keeps Skeleton=%s and Angles=%s independent", (skeleton, angles, skeletonLabel, angleLabel) => {
    const markup = renderStage(states.find((state) => state.type === "Ready")!, skeleton, angles);
    expect(markup).toContain(skeletonLabel); expect(markup).toContain(angleLabel);
    expect(markup).toContain(`data-control="angles-toggle"`);
  });

  it("hides only the skeleton canvas when the display preference is off", () => {
    const markup = renderStage(states.find((state) => state.type === "Ready")!, false);
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain("Skeleton Off");
    expect(markup).toContain('aria-label="Live camera preview"');
    expect(markup).toContain('aria-label="Capture skeleton overlay"');
    expect(markup).toContain('hidden=""');
  });

  it("renders recorded review instead of live camera and keeps Save/Retake intents", () => {
    const state = { type: "Reviewing", snapshot: snapshot("Camera disconnected.") } as const;
    const markup = renderStage(state);
    expect(markup).toContain('data-testid="review-surface"');
    expect(markup).not.toContain('data-testid="live-surface"');
    expect(markup).toContain("Save Recording");
    expect(markup).toContain("Retake");
    expect(markup).toContain("Camera disconnected.");
    expect(markup).toContain("Duration");
    expect(markup).toContain("00:01");
  });

  it("disables review playback controls while Saving", () => {
    const markup = renderStage(states.find((state) => state.type === "Saving")!);
    expect(markup).toContain('data-stage-mode="saving"');
    expect(markup).toContain("disabled=\"\"");
    expect(markup).not.toContain(">Save Recording</button>");
    expect(markup).toContain('data-testid="saving-indeterminate"');
    expect(markup).not.toMatch(/\d+%/);
  });

  it("shows View Record on Completed and Retry only for retryable Failed", () => {
    const completed = renderStage(states.find((state) => state.type === "Completed")!);
    expect(completed).toContain("View Record");
    expect(completed).toContain("Sprint session");
    expect(completed).not.toContain("Working…");
    expect(renderStage(states.find((state) => state.type === "Failed")!)).toContain(">Try again</button>");
    const failed: CaptureProductState = { type: "Failed", stage: "analysis", safeMessage: "Unavailable.", retryable: false, recoveryTarget: "none", routeLeaveRequiresConfirmation: false };
    expect(renderStage(failed)).not.toContain(">Retry</button>");
  });

  it("keeps Completed and Failed as distinct stable viewport surfaces", () => {
    const completed = renderStage(states.find((state) => state.type === "Completed")!);
    const failed = renderStage(states.find((state) => state.type === "Failed")!);
    expect(completed).toContain('data-testid="completed-surface"');
    expect(completed).not.toContain('data-testid="failed-surface"');
    expect(failed).toContain('data-testid="failed-surface"');
    expect(failed).not.toContain('data-testid="completed-surface"');
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
    const markup = states.map((state) => renderStage(state)).join(" ");
    ["Start Camera", "Stop Camera", "Start Recording", "Stop Recording", "Upload", "Close Preview", "Clear Preview"].forEach((label) => {
      expect(markup).not.toContain(label);
    });
  });
});
