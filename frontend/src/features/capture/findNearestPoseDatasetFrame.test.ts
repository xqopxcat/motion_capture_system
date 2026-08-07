import { describe, expect, it } from "vitest";
import { findActivePoseDatasetFrame, findNearestPoseDatasetFrame } from "./findNearestPoseDatasetFrame";
import type { CapturePoseDatasetDraftFrame } from "./buildPoseDatasetDraft";

function createFrame(frameIndex: number, timestampMs: number): CapturePoseDatasetDraftFrame {
  return {
    frameIndex,
    timestampMs,
    landmarks2D: [],
    landmarks3D: [],
  };
}

describe("findNearestPoseDatasetFrame", () => {
  it("returns the nearest pose frame within the threshold", () => {
    const frames = [createFrame(0, 0), createFrame(1, 66), createFrame(2, 132)];

    expect(findNearestPoseDatasetFrame(frames, 90, 100)?.frameIndex).toBe(1);
  });

  it("returns null when no pose frame is close enough", () => {
    const frames = [createFrame(0, 0), createFrame(1, 66)];

    expect(findNearestPoseDatasetFrame(frames, 240, 100)).toBeNull();
  });

  it("handles an empty frame list safely", () => {
    expect(findNearestPoseDatasetFrame([], 0)).toBeNull();
  });
});

describe("findActivePoseDatasetFrame", () => {
  const frames = [createFrame(0, 0), createFrame(1, 134), createFrame(2, 500)];

  it("holds the latest published frame across sparse inference gaps", () => {
    expect(findActivePoseDatasetFrame(frames, 133)?.frameIndex).toBe(0);
    expect(findActivePoseDatasetFrame(frames, 300)?.frameIndex).toBe(1);
    expect(findActivePoseDatasetFrame(frames, 499)?.frameIndex).toBe(1);
    expect(findActivePoseDatasetFrame(frames, 900)?.frameIndex).toBe(2);
  });

  it("does not show a future frame before it becomes active", () => {
    expect(findActivePoseDatasetFrame([createFrame(0, 50)], 49)).toBeNull();
  });

  it("handles empty and nonfinite input safely", () => {
    expect(findActivePoseDatasetFrame([], 0)).toBeNull();
    expect(findActivePoseDatasetFrame(frames, Number.NaN)).toBeNull();
  });
});
