import { describe, expect, it } from "vitest";
import {
  deriveComparePlaybackBounds,
  mapCompareSyncFrames,
} from "./useComparePlaybackController";

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

describe("mapCompareSyncFrames", () => {
  it("keeps left on the shared frame and offsets right", () => {
    expect(
      mapCompareSyncFrames({
        leftFrameCount: 100,
        rightFrameCount: 100,
        sharedFrame: 20,
        syncOffsetFrames: 5,
      }),
    ).toEqual({
      leftFrame: 20,
      rightFrame: 25,
    });
  });

  it("clamps offset frames to each side frame range", () => {
    expect(
      mapCompareSyncFrames({
        leftFrameCount: 40,
        rightFrameCount: 30,
        sharedFrame: 38,
        syncOffsetFrames: 10,
      }),
    ).toEqual({
      leftFrame: 38,
      rightFrame: 29,
    });

    expect(
      mapCompareSyncFrames({
        leftFrameCount: 40,
        rightFrameCount: 30,
        sharedFrame: 2,
        syncOffsetFrames: -10,
      }),
    ).toEqual({
      leftFrame: 2,
      rightFrame: 0,
    });
  });
});
