import { describe, expect, it } from "vitest";
import { buildPoseDatasetDraft } from "./buildPoseDatasetDraft";
import type { CapturePoseFrame } from "./usePoseFrameCollection";

function createPoseFrame(frameIndex: number, timestampMs: number): CapturePoseFrame {
  return {
    frameIndex,
    timestampMs,
    landmarks2D: [
      {
        id: 0,
        name: "nose",
        x: 0.5,
        y: 0.25,
        visibility: 0.9,
      },
    ],
    landmarks3D: [
      {
        id: 0,
        name: "nose",
        x: 0.1,
        y: 0.2,
        z: 0.3,
        visibility: 0.8,
      },
    ],
  };
}

describe("buildPoseDatasetDraft", () => {
  it("builds a runtime pose.v1 draft from collected capture pose frames", () => {
    const frames = [createPoseFrame(0, 0), createPoseFrame(1, 66)];

    const draft = buildPoseDatasetDraft(frames);

    expect(draft).toEqual({
      schemaVersion: "pose.v1",
      source: {
        type: "capture",
      },
      metadata: {
        frameCount: 2,
        durationMs: 66,
        jointCount: 1,
        has2D: true,
        has3D: true,
      },
      frames,
    });
  });

  it("copies landmarks without mutating input frames", () => {
    const frames = [createPoseFrame(0, 0)];

    const draft = buildPoseDatasetDraft(frames);

    expect(draft.frames[0]).not.toBe(frames[0]);
    expect(draft.frames[0].landmarks2D).not.toBe(frames[0].landmarks2D);
    expect(draft.frames[0].landmarks3D).not.toBe(frames[0].landmarks3D);

    draft.frames[0].landmarks2D[0].x = 1;
    expect(frames[0].landmarks2D[0].x).toBe(0.5);
  });

  it("handles an empty frame list safely", () => {
    const draft = buildPoseDatasetDraft([]);

    expect(draft.metadata).toEqual({
      frameCount: 0,
      durationMs: 0,
      jointCount: 0,
      has2D: false,
      has3D: false,
    });
    expect(draft.frames).toEqual([]);
  });
});
