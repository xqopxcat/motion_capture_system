import { describe, expect, it } from "vitest";
import { classifySavingFailure, mapPublishProgressToSavingSubstate, normalizeCaptureTitle } from "./useCaptureController";

describe("capture controller policies", () => {
  it("maps publisher stages into approved Saving substates", () => {
    expect(mapPublishProgressToSavingSubstate({ stage: "preparing", message: "a" }).stage).toBe("Analyzing");
    expect(mapPublishProgressToSavingSubstate({ stage: "creating", message: "b" }).stage).toBe("CreatingRecord");
    expect(mapPublishProgressToSavingSubstate({ stage: "uploading-pose", message: "c" })).toMatchObject({
      stage: "UploadingArtifacts",
      artifact: "pose",
    });
    expect(mapPublishProgressToSavingSubstate({ stage: "finalizing", message: "d" }).stage).toBe("Finalizing");
  });

  it("blocks retry after ambiguous creation outcome", () => {
    expect(classifySavingFailure(new TypeError("network"), {
      completedArtifacts: new Set(),
      creationOutcomeAmbiguous: true,
    })).toMatchObject({
      stage: "record-creation-ambiguous",
      retryable: false,
      recoveryTarget: "none",
    });
  });

  it("reuses known Record recovery context", () => {
    expect(classifySavingFailure(new Error("upload"), {
      recordId: "record-1",
      completedArtifacts: new Set(["video"]),
    })).toMatchObject({
      stage: "upload",
      retryable: true,
      recoveryTarget: "SavingUploading",
    });
  });

  it("never exposes a raw provider failure and classifies finalization precisely", () => {
    const failure = classifySavingFailure(
      new Error("bucket secret signed-url"),
      { recordId: "record-1", completedArtifacts: new Set(["video", "pose", "metrics", "thumbnail"]) },
      { stage: "Finalizing", progress: null },
    );
    expect(failure).toMatchObject({
      stage: "finalization",
      retryable: true,
      recoveryTarget: "SavingFinalizing",
    });
    expect(failure.safeMessage).not.toContain("bucket secret signed-url");
  });

  it("trims the review title and preserves the existing default fallback", () => {
    expect(normalizeCaptureTitle("  Sprint run  ", "Old")).toBe("Sprint run");
    expect(normalizeCaptureTitle(" ", " Existing title ")).toBe("Existing title");
    expect(normalizeCaptureTitle(" ", " ", new Date("2026-07-30T00:00:00Z"))).toMatch(/^Motion Capture /);
  });
});
