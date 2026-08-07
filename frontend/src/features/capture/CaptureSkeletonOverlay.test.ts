import { describe, expect, it, vi } from "vitest";
import type { FilteredRuntimePose } from "../../engines/pose";
import { renderCapturePoseLayers } from "./CaptureSkeletonOverlay";

function pose(): FilteredRuntimePose {
  const landmarks2D = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: 0.1, y: 0.1, visibility: 1 }));
  const landmarks3D = Array.from({ length: 33 }, (_, id) => ({ ...landmarks2D[id], z: 0 }));
  for (const [a, b, c] of [[23, 25, 27], [24, 26, 28]] as const) {
    Object.assign(landmarks2D[a], { x: a === 23 ? 0.4 : 0.6, y: 0.25 });
    Object.assign(landmarks2D[b], { x: a === 23 ? 0.4 : 0.6, y: 0.5 });
    Object.assign(landmarks2D[c], { x: a === 23 ? 0.6 : 0.8, y: 0.5 });
    Object.assign(landmarks3D[a], { x: 0, y: 1, z: 0 });
    Object.assign(landmarks3D[b], { x: 0, y: 0, z: 0 });
    Object.assign(landmarks3D[c], { x: 1, y: 0, z: 0 });
  }
  const quality = Array.from({ length: 33 }, (_, id) => ({ id, state: "filtered" as const, sourceTimestampMs: 100 }));
  return { engineName: "test", engineVersion: "1", timestampMs: 100, frameIndex: 1, cameraSessionId: 1, runtimeProfileId: "runtime-visualization.stabilized.v1", landmarks2D, landmarks3D, landmarkQuality: quality, landmarkQuality3D: quality, qualityDiagnostics: { filtered: 66, held: 0, outliers: 0, unavailable: 0 } } as unknown as FilteredRuntimePose;
}

function surface() {
  const canvas = { width: 400, height: 300, getBoundingClientRect: () => ({ width: 400, height: 300 }) } as unknown as HTMLCanvasElement;
  const value = { arc: vi.fn(), beginPath: vi.fn(), clearRect: vi.fn(), fill: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), lineTo: vi.fn(), moveTo: vi.fn(), restore: vi.fn(), save: vi.fn(), setLineDash: vi.fn(), stroke: vi.fn(), globalAlpha: 1, lineCap: "butt", lineJoin: "miter", lineWidth: 1, strokeStyle: "", fillStyle: "", font: "", textAlign: "start", textBaseline: "alphabetic" };
  const context = value as typeof value & CanvasRenderingContext2D;
  return { canvas, context };
}

describe("Task 84 live Skeleton/Angle composition", () => {
  it.each([
    [true, false, true, false],
    [false, true, false, true],
    [true, true, true, true],
    [false, false, false, false],
  ] as const)("renders skeleton=%s angles=%s independently", (skeletonVisible, anglesVisible, expectSkeleton, expectAngles) => {
    const { canvas, context } = surface();
    const result = renderCapturePoseLayers({ canvas, context, poseResult: pose(), skeletonVisible, anglesVisible, mirror: true });
    expect(context.clearRect).toHaveBeenCalledOnce();
    expect(context.lineTo.mock.calls.length > 0).toBe(expectSkeleton);
    expect(result.angleOverlay !== null).toBe(expectAngles);
    expect(context.fillText.mock.calls.length > 0).toBe(expectAngles);
    if (expectAngles) expect(result.angleResults.every((angle) => angle.status === "available")).toBe(true);
  });

  it("clears and draws no stale angle when current results are unavailable", () => {
    const { canvas, context } = surface();
    const unavailable = { ...pose(), landmarks2D: Array(33).fill(null), landmarks3D: Array(33).fill(null) } as unknown as FilteredRuntimePose;
    const result = renderCapturePoseLayers({ canvas, context, poseResult: unavailable, skeletonVisible: false, anglesVisible: true, mirror: false });
    expect(context.clearRect).toHaveBeenCalledOnce();
    expect(result.angleResults.every((angle) => angle.status === "unavailable")).toBe(true);
    expect(context.fillText).not.toHaveBeenCalled();
  });

  it("mirroring changes display geometry without swapping metric identity", () => {
    const front = surface();
    const rear = surface();
    const frontResult = renderCapturePoseLayers({ ...front, poseResult: pose(), skeletonVisible: false, anglesVisible: true, mirror: true });
    const rearResult = renderCapturePoseLayers({ ...rear, poseResult: pose(), skeletonVisible: false, anglesVisible: true, mirror: false });
    expect(frontResult.angleResults.map(({ metricId }) => metricId)).toEqual(rearResult.angleResults.map(({ metricId }) => metricId));
    expect(frontResult.angleOverlay!.metrics[0].vertex.x).toBeCloseTo(front.canvas.width - rearResult.angleOverlay!.metrics[0].vertex.x);
  });
});
