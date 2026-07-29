import { describe, expect, it } from "vitest";
import { buildPoseDatasetDraft } from "./buildPoseDatasetDraft";
import { MINIMUM_REVIEW_DURATION_MS, validateCaptureReviewCandidate } from "./captureReviewValidation";

function candidate(overrides: Record<string, unknown> = {}) {
  const landmarks = Array.from({ length: 33 }, (_, id) => ({
    id, name: `joint_${id}`, visibility: 1, x: 0.5, y: 0.5, z: 0,
  }));
  return {
    reviewToken: { kind: "review" as const, id: 2 },
    recordingToken: { kind: "recording" as const, id: 1 },
    recordingOriginMs: 100,
    durationMs: MINIMUM_REVIEW_DURATION_MS,
    videoBlob: new Blob(["video"]),
    videoUrl: "blob:test",
    poseDraft: buildPoseDatasetDraft([{
      frameIndex: 0, timestampMs: 0, landmarks2D: landmarks, landmarks3D: landmarks,
    }]),
    title: "",
    interruptionReason: null,
    diagnosticSessionStartedAtMs: null,
    ...overrides,
  };
}

describe("capture review validation", () => {
  it("accepts the named minimum duration with video and raw pose", () => {
    expect(validateCaptureReviewCandidate(candidate()).valid).toBe(true);
  });

  it("rejects empty, short or pose-less partial output", () => {
    const result = validateCaptureReviewCandidate(candidate({
      durationMs: MINIMUM_REVIEW_DURATION_MS - 1,
      videoBlob: new Blob(),
      poseDraft: buildPoseDatasetDraft([]),
    }));
    expect(result.errors).toEqual(["video-empty", "duration-too-short", "pose-empty"]);
  });

  it("keeps interrupted valid output reviewable", () => {
    expect(validateCaptureReviewCandidate(candidate({ interruptionReason: "track ended" })).valid).toBe(true);
  });
});

