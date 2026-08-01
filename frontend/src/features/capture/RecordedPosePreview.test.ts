import { describe, expect, it } from "vitest";
import { recordedPreviewAspectRatio } from "./RecordedPosePreview";

describe("Recorded Pose Preview geometry", () => {
  it("uses the recorded video's intrinsic aspect ratio", () => {
    expect(recordedPreviewAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
    expect(recordedPreviewAspectRatio(1280, 960)).toBeCloseTo(4 / 3);
    expect(recordedPreviewAspectRatio(720, 1280)).toBeCloseTo(9 / 16);
  });

  it("uses 16:9 only before valid metadata is available", () => {
    expect(recordedPreviewAspectRatio(0, 0)).toBeCloseTo(16 / 9);
  });
});
