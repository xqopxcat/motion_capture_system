import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { FilteredRuntimePose } from "../pose";
import { JOINT_ANGLE_CONTRACT_VERSION, type FormalJointAngleResult, type RuntimeJointAngleResult } from "../motionModel";
import { projectProductionSkeletonPoint } from "./renderProductionSkeleton";
import { RUNTIME_ANGLE_OVERLAY_PROFILE } from "./runtimeAngleOverlayProfile";
import { formatRuntimeAngleLabel, getRuntimeAngleOverlayDisplayScale, prepareRuntimeAngleOverlay, renderRuntimeAngleOverlay } from "./renderRuntimeAngleOverlay";

const metricId = "joint-angle.left-knee.internal.v1" as const;
function canvas(width = 400, height = 200, cssWidth = 200) { return { width, height, getBoundingClientRect: () => ({ width: cssWidth, height: height / (width / cssWidth) }) } as unknown as HTMLCanvasElement; }
function pose(): FilteredRuntimePose {
  const landmarks2D = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: .1, y: .1, visibility: 1 }));
  Object.assign(landmarks2D[23], { x: .5, y: .25 }); Object.assign(landmarks2D[25], { x: .5, y: .5 }); Object.assign(landmarks2D[27], { x: .75, y: .5 });
  return { engineName: "test", engineVersion: "1", timestampMs: 100, frameIndex: 2, cameraSessionId: 3, runtimeProfileId: "runtime-visualization.stabilized.v1", landmarks2D, landmarks3D: [], landmarkQuality: [], landmarkQuality3D: [], qualityDiagnostics: { filtered: 0, held: 0, outliers: 0, unavailable: 0 } } as unknown as FilteredRuntimePose;
}
function result(change: Partial<RuntimeJointAngleResult> = {}): RuntimeJointAngleResult {
  return { metricId, contractVersion: JOINT_ANGLE_CONTRACT_VERSION, provenance: "runtime-display", runtimeProfileId: "runtime-visualization.stabilized.v1", status: "available", valueDegrees: 123.4, coordinateSpace: "world-3d", sourceTimestampMs: 100, frameIndex: 2, cameraSessionId: 3, inputLandmarkIds: [23, 25, 27], confidence: .9, ...change } as RuntimeJointAngleResult;
}
function context() {
  return { arc: vi.fn(), beginPath: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), restore: vi.fn(), save: vi.fn(), setLineDash: vi.fn(), stroke: vi.fn(), drawImage: vi.fn(), globalAlpha: 1, lineWidth: 1, strokeStyle: "", fillStyle: "", font: "", textAlign: "start", textBaseline: "alphabetic" } as unknown as CanvasRenderingContext2D;
}

describe("Task 80 runtime angle overlay preparation", () => {
  it("places world-3D values with normalized 2D landmarks and preserves numeric result", () => {
    const target = canvas(); const inputPose = pose();
    const model = prepareRuntimeAngleOverlay(target, inputPose, [result()], { selectedMetricIds: [metricId] });
    expect(model.metrics[0].points[1]).toEqual(projectProductionSkeletonPoint(target, inputPose.landmarks2D[25]!));
    expect(model.metrics[0]).toMatchObject({ valueDegrees: 123.4, displayValue: "123°", computationCoordinateSpace: "world-3d" });
    expect(model.metrics[0].arc?.spanRadians).toBeCloseTo(Math.PI / 2);
  });

  it("matches shared mirror, contain, cover, and letterbox projection", () => {
    const target = canvas(400, 300, 200); const inputPose = pose(); const viewport = { sourceWidth: 1600, sourceHeight: 900 };
    for (const objectFit of ["contain", "cover"] as const) {
      const options = { selectedMetricIds: [metricId], sourceViewport: viewport, mirror: true, objectFit } as const;
      const model = prepareRuntimeAngleOverlay(target, inputPose, [result()], options);
      expect(model.metrics[0].vertex).toEqual(projectProductionSkeletonPoint(target, inputPose.landmarks2D[25]!, options));
    }
  });

  it("uses DPR-aware bounded sizing without resizing Canvas", () => {
    const target = canvas(400, 200, 200); const before = [target.width, target.height]; const scale = getRuntimeAngleOverlayDisplayScale(target);
    expect(scale.devicePixelRatio).toBe(2); expect(scale.arcWidth).toBeGreaterThanOrEqual(4);
    prepareRuntimeAngleOverlay(target, pose(), [result()], { selectedMetricIds: [metricId] });
    expect([target.width, target.height]).toEqual(before);
  });

  it("keeps 0/180 and near-boundary arc geometry finite without full circles", () => {
    const inputPose = pose(); const cases = [[.5, 0], [.5, .75], [.500001, .25], [.500001, .75]];
    const arcs = cases.map(([x, y]) => {
      const slots = inputPose.landmarks2D.map((item) => item ? { ...item } : null); Object.assign(slots[27]!, { x, y });
      const model = prepareRuntimeAngleOverlay(canvas(), { ...inputPose, landmarks2D: slots } as unknown as FilteredRuntimePose, [result({ valueDegrees: 0 })], { selectedMetricIds: [metricId] });
      return model.metrics[0]?.arc ?? null;
    });
    expect(arcs[0]).toBeNull();
    expect(arcs[1]?.spanRadians).toBeCloseTo(Math.PI);
    for (const arc of arcs.slice(1)) { expect(Number.isFinite(arc?.spanRadians)).toBe(true); expect(arc!.spanRadians).toBeLessThanOrEqual(Math.PI); }
  });

  it("skips degenerate/missing geometry, unavailable, stale and identity mismatches", () => {
    const inputPose = pose(); const slots = inputPose.landmarks2D.map((item) => item ? { ...item } : null); Object.assign(slots[23]!, { x: slots[25]!.x, y: slots[25]!.y });
    expect(prepareRuntimeAngleOverlay(canvas(), { ...inputPose, landmarks2D: slots } as unknown as FilteredRuntimePose, [result()], { selectedMetricIds: [metricId] }).diagnostics.degenerateGeometrySkipped).toBe(1);
    expect(prepareRuntimeAngleOverlay(canvas(), inputPose, [result({ status: "unavailable", valueDegrees: null, reason: "stale-pose", coordinateSpace: null })], { selectedMetricIds: [metricId] }).metrics).toHaveLength(0);
    expect(prepareRuntimeAngleOverlay(canvas(), inputPose, [result({ frameIndex: 99 })], { selectedMetricIds: [metricId] }).diagnostics.identityMismatchSkipped).toBe(1);
    expect(prepareRuntimeAngleOverlay(canvas(), inputPose, [result({ cameraSessionId: 99 })], { selectedMetricIds: [metricId] }).diagnostics.identityMismatchSkipped).toBe(1);
  });

  it("preserves order and deterministically suppresses later colliding labels while retaining arcs", () => {
    const profile = { ...RUNTIME_ANGLE_OVERLAY_PROFILE, label: { ...RUNTIME_ANGLE_OVERLAY_PROFILE.label, maximumAttempts: 1 } };
    const first = prepareRuntimeAngleOverlay(canvas(), pose(), [result()], { selectedMetricIds: [metricId, metricId], profile });
    const second = prepareRuntimeAngleOverlay(canvas(), pose(), [result()], { selectedMetricIds: [metricId, metricId], profile });
    expect(first.metrics.map(({ metricId: id }) => id)).toEqual([metricId, metricId]);
    expect(first.diagnostics).toMatchObject({ renderedArcCount: 2, renderedLabelCount: 1, collisionSuppressedLabels: 1 });
    expect(first).toEqual(second);
  });

  it("formats nearest whole degrees without inventing unavailable values or flexion labels", () => {
    expect(formatRuntimeAngleLabel(0)).toBe("0°"); expect(formatRuntimeAngleLabel(90.4)).toBe("90°"); expect(formatRuntimeAngleLabel(179.6)).toBe("180°"); expect(formatRuntimeAngleLabel(null)).toBeNull(); expect(formatRuntimeAngleLabel(90)).not.toContain("flexion");
  });

  it("prevents formal results at the renderer type boundary", () => {
    expectTypeOf<FormalJointAngleResult>().not.toMatchTypeOf<Parameters<typeof renderRuntimeAngleOverlay>[3][number]>();
  });
});

describe("Task 80 Canvas rendering safety", () => {
  it("draws available/degraded styles, balances state, composes without clear, and never draws images", () => {
    const target = canvas(); const drawing = context(); const original = result();
    renderRuntimeAngleOverlay(target, drawing, pose(), [original], { selectedMetricIds: [metricId], clear: false });
    expect(drawing.clearRect).not.toHaveBeenCalled(); expect(drawing.save).toHaveBeenCalledOnce(); expect(drawing.restore).toHaveBeenCalledOnce(); expect(drawing.arc).toHaveBeenCalledOnce(); expect(drawing.fillText).toHaveBeenCalledWith("123°", expect.any(Number), expect.any(Number)); expect(drawing.drawImage).not.toHaveBeenCalled(); expect(original.valueDegrees).toBe(123.4);
    const degraded = context(); renderRuntimeAngleOverlay(target, degraded, pose(), [result({ status: "degraded", reason: "held-runtime-landmark" })], { selectedMetricIds: [metricId] }); expect(degraded.setLineDash).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Number)]));
  });

  it("never sends NaN or Infinity to Canvas calls", () => {
    const drawing = context(); renderRuntimeAngleOverlay(canvas(), drawing, pose(), [result()], { selectedMetricIds: [metricId] });
    for (const call of [...(drawing.arc as ReturnType<typeof vi.fn>).mock.calls, ...(drawing.fillText as ReturnType<typeof vi.fn>).mock.calls]) for (const value of call) if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
  });
});
