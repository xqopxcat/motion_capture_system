import { describe, expect, it, vi } from "vitest";
import { renderCaptureSkeleton } from "./renderCaptureSkeleton";

function drawingContext() {
  return {
    arc: vi.fn(), beginPath: vi.fn(), clearRect: vi.fn(), fill: vi.fn(), fillRect: vi.fn(),
    lineTo: vi.fn(), moveTo: vi.fn(), restore: vi.fn(), save: vi.fn(), setLineDash: vi.fn(), stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("Capture production skeleton wrapper", () => {
  it("uses the production display filter without mutating the Raw Pose array", () => {
    const landmarks2D = [
      { id: 0, x: 0.5, y: 0.2, visibility: 0.9 },
      { id: 1, x: 0.48, y: 0.18, visibility: 0.9 },
    ];
    const original = structuredClone(landmarks2D);
    const context = drawingContext();
    renderCaptureSkeleton(
      { width: 200, height: 100 } as HTMLCanvasElement,
      context,
      { landmarks2D },
    );
    expect(context.arc).toHaveBeenCalledOnce();
    expect(landmarks2D).toEqual(original);
  });

  it("clears rather than retaining a stale or missing pose", () => {
    const context = drawingContext();
    const canvas = { width: 200, height: 100 } as HTMLCanvasElement;
    renderCaptureSkeleton(canvas, context, null);
    renderCaptureSkeleton(canvas, context, { landmarks2D: [{ id: 0, x: 0.5, y: 0.2 }] }, undefined, 301);
    expect(context.clearRect).toHaveBeenCalledTimes(2);
    expect(context.arc).not.toHaveBeenCalled();
  });
});
