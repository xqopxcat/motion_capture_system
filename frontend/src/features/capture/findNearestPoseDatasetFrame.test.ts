import { describe, expect, it } from "vitest";
import { findNearestPoseDatasetFrame } from "./findNearestPoseDatasetFrame";
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
