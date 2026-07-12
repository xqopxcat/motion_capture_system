import { describe, expect, it } from "vitest";
import { deriveComparePlaybackBounds } from "./useComparePlaybackController";

describe("deriveComparePlaybackBounds", () => {
  it("uses the smaller frame count when both sides are available", () => {
    expect(
      deriveComparePlaybackBounds({
        leftDuration: 5,
        leftFps: 30,
        leftFrameCount: 150,
        rightDuration: 4,
        rightFps: 30,
        rightFrameCount: 120,
      }),
    ).toEqual({
      duration: 4,
      fps: 30,
      totalFrames: 120,
    });
  });

  it("falls back to the available side when one side has no frame data yet", () => {
    expect(
      deriveComparePlaybackBounds({
        leftDuration: 5,
        leftFps: 30,
        leftFrameCount: 150,
      }),
    ).toEqual({
      duration: 5,
      fps: 30,
      totalFrames: 150,
    });
  });
});
