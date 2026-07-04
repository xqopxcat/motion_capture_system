import { describe, expect, it } from "vitest";
import type { PoseDataset } from "../../types";
import { createViewerRenderContext, selectPoseFrameByIndex } from "./viewerRenderContext";

function createPoseDataset(): PoseDataset {
  return {
    version: "1.0",
    poseEngine: "MediaPipe Pose Landmarker",
    poseEngineVersion: "0.10.x",
    fps: 30,
    frameCount: 2,
    duration: 0.033,
    generatedAt: "2026-07-04T00:00:00.000Z",
    frames: [
      {
        frameIndex: 0,
        timestamp: 0,
        landmarks2D: [],
        landmarks3D: [],
      },
      {
        frameIndex: 1,
        timestamp: 0.033,
        landmarks2D: [],
        landmarks3D: [],
      },
    ],
  };
}

describe("viewerRenderContext", () => {
  it("selects a pose frame by current frame", () => {
    expect(selectPoseFrameByIndex(createPoseDataset(), 1)?.frameIndex).toBe(1);
  });

  it("clamps out-of-range frame selection", () => {
    expect(selectPoseFrameByIndex(createPoseDataset(), 99)?.frameIndex).toBe(1);
    expect(selectPoseFrameByIndex(createPoseDataset(), -4)?.frameIndex).toBe(0);
  });

  it("returns null when pose dataset is missing", () => {
    expect(selectPoseFrameByIndex(null, 0)).toBeNull();
  });

  it("creates a skeleton render context for the active pose frame", () => {
    const context = createViewerRenderContext({
      canvasId: "viewer-canvas",
      currentFrame: 1,
      poseDataset: createPoseDataset(),
    });

    expect(context).toMatchObject({
      canvasId: "viewer-canvas",
      frameIndex: 1,
      mode: "skeleton",
      poseFrame: {
        frameIndex: 1,
      },
    });
  });
});
