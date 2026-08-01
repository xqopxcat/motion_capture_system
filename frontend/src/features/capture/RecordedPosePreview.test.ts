import { describe, expect, it } from "vitest";
import {
  MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX,
  recordedPreviewAspectRatio,
  recordedPreviewMaximumWidth,
} from "./RecordedPosePreview";

describe("Recorded Pose Preview geometry", () => {
  it("uses the recorded video's intrinsic aspect ratio", () => {
    expect(recordedPreviewAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
    expect(recordedPreviewAspectRatio(1280, 960)).toBeCloseTo(4 / 3);
    expect(recordedPreviewAspectRatio(720, 1280)).toBeCloseTo(9 / 16);
  });

  it("uses 16:9 only before valid metadata is available", () => {
    expect(recordedPreviewAspectRatio(0, 0)).toBeCloseTo(16 / 9);
  });

  it("caps display size without changing the recorded aspect ratio", () => {
    expect(recordedPreviewMaximumWidth(4 / 3)).toBeCloseTo(
      MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX * 4 / 3,
    );
    expect(recordedPreviewMaximumWidth(9 / 16)).toBeCloseTo(
      MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX * 9 / 16,
    );
  });
});
