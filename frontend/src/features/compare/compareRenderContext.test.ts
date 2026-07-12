import { describe, expect, it } from "vitest";
import { createCompareRenderContext } from "./compareRenderContext";

describe("createCompareRenderContext", () => {
  it("creates an independent frame zero skeleton render context", () => {
    const context = createCompareRenderContext({
      canvasId: "compare-left-canvas",
      poseDataset: {
        duration: 1,
        fps: 30,
        frameCount: 1,
        frames: [
          {
            frameIndex: 0,
            landmarks2D: [],
            landmarks3D: [],
            timestamp: 0,
          },
        ],
        generatedAt: "2026-07-13T00:00:00.000Z",
        poseEngine: "test",
        poseEngineVersion: "1.0.0",
        version: "pose.v1",
      },
    });

    expect(context.canvasId).toBe("compare-left-canvas");
    expect(context.frameIndex).toBe(0);
    expect(context.mode).toBe("skeleton");
    expect(context.poseFrame?.frameIndex).toBe(0);
  });
});
