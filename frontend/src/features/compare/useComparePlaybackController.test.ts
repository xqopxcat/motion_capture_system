import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPARE_SYNC_OFFSET_FRAMES,
  applyCompareSyncOffsetDelta,
  deriveComparePlaybackBounds,
  mapCompareSyncFrames,
  mapCompareSyncFramesByTime,
  resetCompareSyncOffset,
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
  it("uses zero as the default sync offset", () => {
    expect(DEFAULT_COMPARE_SYNC_OFFSET_FRAMES).toBe(0);
    expect(
      mapCompareSyncFrames({
        leftFrameCount: 100,
        rightFrameCount: 100,
        sharedFrame: 10,
        syncOffsetFrames: DEFAULT_COMPARE_SYNC_OFFSET_FRAMES,
      }),
    ).toEqual({
      leftFrame: 10,
      rightFrame: 10,
    });
  });

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

  it("does not crash when frame counts differ or are unavailable", () => {
    expect(
      mapCompareSyncFrames({
        leftFrameCount: 2,
        rightFrameCount: 200,
        sharedFrame: 10,
        syncOffsetFrames: 3,
      }),
    ).toEqual({
      leftFrame: 1,
      rightFrame: 13,
    });

    expect(
      mapCompareSyncFrames({
        sharedFrame: 10,
        syncOffsetFrames: 3,
      }),
    ).toEqual({
      leftFrame: 0,
      rightFrame: 0,
    });
  });
});

describe("mapCompareSyncFramesByTime", () => {
  it("resolves each skeleton from its own irregular pose timestamps", () => {
    expect(mapCompareSyncFramesByTime({
      currentTime: 0.24,
      leftFrameTimestamps: [0, 0.1, 0.2, 0.3],
      rightFrameTimestamps: [0, 0.15, 0.31],
      syncOffsetFrames: 0,
    })).toEqual({ leftFrame: 2, rightFrame: 2 });
  });

  it("applies offset after timestamp alignment and clamps the right frame", () => {
    expect(mapCompareSyncFramesByTime({
      currentTime: 0.16,
      leftFrameTimestamps: [0, 0.1, 0.2],
      rightFrameTimestamps: [0, 0.12, 0.27, 0.4],
      syncOffsetFrames: 1,
    })).toEqual({ leftFrame: 2, rightFrame: 2 });
    expect(mapCompareSyncFramesByTime({
      currentTime: 0.4,
      leftFrameTimestamps: [0, 0.2, 0.4],
      rightFrameTimestamps: [0, 0.2, 0.4],
      syncOffsetFrames: 10,
    }).rightFrame).toBe(2);
  });
});

describe("compare sync offset helpers", () => {
  it("applies manual offset deltas and reset", () => {
    expect(applyCompareSyncOffsetDelta(0, 1)).toBe(1);
    expect(applyCompareSyncOffsetDelta(1, -10)).toBe(-9);
    expect(resetCompareSyncOffset()).toBe(0);
  });
});
