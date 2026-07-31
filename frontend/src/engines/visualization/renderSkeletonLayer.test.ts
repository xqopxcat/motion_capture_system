import { describe, expect, it, vi } from "vitest";
import type { RenderContext } from "../../types";
import { getHighlightedJointIdSet, renderSkeletonLayer } from "./renderSkeletonLayer";

function createRenderContext(highlightedJointIds: number[] = []): RenderContext {
  return {
    canvasId: "test-canvas",
    frameIndex: 0,
    highlightedJointIds,
    mode: "skeleton",
    poseFrame: {
      frameIndex: 0,
      timestamp: 0,
      landmarks2D: [
        {
          id: 0,
          name: "nose",
          visibility: 0.9,
          x: 0.5,
          y: 0.5,
          z: 0,
        },
      ],
      landmarks3D: [],
    },
  };
}

function createCanvasContext() {
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fill: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("renderSkeletonLayer", () => {
  it("collects valid highlighted joint ids from render input", () => {
    const highlightedJointIds = getHighlightedJointIdSet({
      ...createRenderContext([0, -1, 2.5, Number.NaN]),
      selectedJointId: 12,
    });

    expect(Array.from(highlightedJointIds)).toEqual([0, 12]);
  });

  it("renders highlighted visible joints without crashing on invalid ids", () => {
    const canvas = { height: 100, width: 100 } as HTMLCanvasElement;
    const context = createCanvasContext();

    renderSkeletonLayer(canvas, context, createRenderContext([0, 99]));

    expect(context.arc).toHaveBeenCalledTimes(2);
    expect(vi.mocked(context.arc).mock.calls[0].slice(0, 2)).toEqual([50, 50]);
    expect(vi.mocked(context.arc).mock.calls[1].slice(0, 2)).toEqual([50, 50]);
  });
});
