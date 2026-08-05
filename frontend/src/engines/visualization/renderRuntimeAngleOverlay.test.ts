import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { FilteredRuntimePose } from "../pose";
import { JOINT_ANGLE_CONTRACT_VERSION, type FormalJointAngleResult, type RuntimeJointAngleResult } from "../motionModel";
import { projectProductionSkeletonPoint } from "./renderProductionSkeleton";
import { RUNTIME_ANGLE_OVERLAY_PROFILE } from "./runtimeAngleOverlayProfile";
import { formatRuntimeAngleLabel, getRuntimeAngleOverlayDisplayScale, prepareFormalAngleOverlay, prepareRuntimeAngleOverlay, renderFormalAngleOverlay, renderRuntimeAngleOverlay } from "./renderRuntimeAngleOverlay";

const metricId = "joint-angle.left-knee.internal.v1" as const;
function canvas(width = 400, height = 200, cssWidth = 200) { return { width, height, getBoundingClientRect: () => ({ width: cssWidth, height: height / (width / cssWidth) }) } as unknown as HTMLCanvasElement; }
function pose(): FilteredRuntimePose {
  const landmarks2D = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: .1, y: .1, visibility: 1 }));
  Object.assign(landmarks2D[23], { x: .5, y: .25 }); Object.assign(landmarks2D[25], { x: .5, y: .5 }); Object.assign(landmarks2D[27], { x: .75, y: .5 });
  Object.assign(landmarks2D[24], { x: .2, y: .25 }); Object.assign(landmarks2D[26], { x: .2, y: .5 }); Object.assign(landmarks2D[28], { x: .45, y: .5 });
  return { engineName: "test", engineVersion: "1", timestampMs: 100, frameIndex: 2, cameraSessionId: 3, runtimeProfileId: "runtime-visualization.stabilized.v1", landmarks2D, landmarks3D: [], landmarkQuality: [], landmarkQuality3D: [], qualityDiagnostics: { filtered: 0, held: 0, outliers: 0, unavailable: 0 } } as unknown as FilteredRuntimePose;
}
function result(change: Partial<RuntimeJointAngleResult> = {}): RuntimeJointAngleResult {
  return { metricId, contractVersion: JOINT_ANGLE_CONTRACT_VERSION, provenance: "runtime-display", runtimeProfileId: "runtime-visualization.stabilized.v1", status: "available", valueDegrees: 123.4, coordinateSpace: "world-3d", sourceTimestampMs: 100, frameIndex: 2, cameraSessionId: 3, inputLandmarkIds: [23, 25, 27], confidence: .9, ...change } as RuntimeJointAngleResult;
}
function context() {
  let alpha = 1; const arcAlpha: number[] = []; const labelBackgroundAlpha: number[] = []; const labelTextAlpha: number[] = [];
  const value = { arc: vi.fn(() => arcAlpha.push(alpha)), beginPath: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(() => labelBackgroundAlpha.push(alpha)), fillText: vi.fn(() => labelTextAlpha.push(alpha)), restore: vi.fn(), save: vi.fn(), setLineDash: vi.fn(), stroke: vi.fn(), drawImage: vi.fn(), lineWidth: 1, strokeStyle: "", fillStyle: "", font: "", textAlign: "start", textBaseline: "alphabetic", arcAlpha, labelBackgroundAlpha, labelTextAlpha,
    set globalAlpha(next: number) { alpha = next; }, get globalAlpha() { return alpha; } };
  return value as typeof value & CanvasRenderingContext2D;
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

  it("provides a formal Review entry point without weakening runtime provenance", () => {
    const formal: FormalJointAngleResult = { metricId, contractVersion: JOINT_ANGLE_CONTRACT_VERSION, provenance: "formal-analysis", analysisProfileId: "joint-angle-analysis.v1", analysisProfileVersion: "1.0.0", status: "available", valueDegrees: 91, coordinateSpace: "world-3d", sourceTimestampMs: 100, frameIndex: 2, cameraSessionId: 3, inputLandmarkIds: [23, 25, 27], confidence: .9 };
    const prepared = prepareFormalAngleOverlay(canvas(), pose(), [formal], { selectedMetricIds: [metricId] });
    expect(prepared.metrics[0]).toMatchObject({ displayValue: "91°", computationCoordinateSpace: "world-3d" });
    const drawing = context(); renderFormalAngleOverlay(canvas(), drawing, pose(), [formal], { selectedMetricIds: [metricId], clear: false });
    expect(drawing.fillText).toHaveBeenCalledWith("91°", expect.any(Number), expect.any(Number));
    expectTypeOf<FormalJointAngleResult>().toMatchTypeOf<Parameters<typeof renderFormalAngleOverlay>[3][number]>();
  });
});

describe("Task 80 Canvas rendering safety", () => {
  it("uses centralized available arc and label opacity while preserving Canvas safety", () => {
    const target = canvas(); const drawing = context(); const original = result();
    renderRuntimeAngleOverlay(target, drawing, pose(), [original], { selectedMetricIds: [metricId], clear: false });
    expect(drawing.clearRect).not.toHaveBeenCalled(); expect(drawing.save).toHaveBeenCalledOnce(); expect(drawing.restore).toHaveBeenCalledOnce(); expect(drawing.arc).toHaveBeenCalledOnce(); expect(drawing.fillText).toHaveBeenCalledWith("123°", expect.any(Number), expect.any(Number)); expect(drawing.drawImage).not.toHaveBeenCalled(); expect(original.valueDegrees).toBe(123.4);
    expect(drawing.arcAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.available.arcOpacity]);
    expect(drawing.labelBackgroundAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.available.labelOpacity]);
    expect(drawing.labelTextAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.available.labelOpacity]);
  });

  it("uses degraded opacity for arc, label background and text without resetting alpha", () => {
    const degraded = context(); renderRuntimeAngleOverlay(canvas(), degraded, pose(), [result({ status: "degraded", reason: "held-runtime-landmark" })], { selectedMetricIds: [metricId] });
    expect(degraded.arcAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.degraded.arcOpacity]);
    expect(degraded.labelBackgroundAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.degraded.labelOpacity]);
    expect(degraded.labelTextAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.degraded.labelOpacity]);
    expect(degraded.labelTextAlpha).not.toContain(1);
    expect(degraded.setLineDash).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Number)]));
    expect(degraded.setLineDash).toHaveBeenCalledWith([]);
    expect(degraded.save).toHaveBeenCalledOnce(); expect(degraded.restore).toHaveBeenCalledOnce();
  });

  it("reapplies separate degraded then available styles without alpha or dash leakage", () => {
    const rightMetricId = "joint-angle.right-knee.internal.v1" as const;
    const right = result({ metricId: rightMetricId, inputLandmarkIds: [24, 26, 28], status: "available" });
    const drawing = context(); renderRuntimeAngleOverlay(canvas(), drawing, pose(), [result({ status: "degraded", reason: "held-runtime-landmark" }), right], { selectedMetricIds: [metricId, rightMetricId] });
    expect(drawing.arcAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.degraded.arcOpacity, RUNTIME_ANGLE_OVERLAY_PROFILE.available.arcOpacity]);
    expect(drawing.labelTextAlpha).toEqual([RUNTIME_ANGLE_OVERLAY_PROFILE.degraded.labelOpacity, RUNTIME_ANGLE_OVERLAY_PROFILE.available.labelOpacity]);
    expect(drawing.setLineDash).toHaveBeenNthCalledWith(1, expect.arrayContaining([expect.any(Number)]));
    expect(drawing.setLineDash).toHaveBeenNthCalledWith(3, []);
    expect(drawing.save).toHaveBeenCalledOnce(); expect(drawing.restore).toHaveBeenCalledOnce();
  });

  it("draws neither arc nor label for unavailable metrics", () => {
    const drawing = context(); renderRuntimeAngleOverlay(canvas(), drawing, pose(), [result({ status: "unavailable", reason: "low-confidence", valueDegrees: null, coordinateSpace: "world-3d" })], { selectedMetricIds: [metricId] });
    expect(drawing.arc).not.toHaveBeenCalled(); expect(drawing.fillRect).not.toHaveBeenCalled(); expect(drawing.fillText).not.toHaveBeenCalled();
  });

  it("never sends NaN or Infinity to Canvas calls", () => {
    const drawing = context(); renderRuntimeAngleOverlay(canvas(), drawing, pose(), [result()], { selectedMetricIds: [metricId] });
    for (const call of [...(drawing.arc as ReturnType<typeof vi.fn>).mock.calls, ...(drawing.fillText as ReturnType<typeof vi.fn>).mock.calls]) for (const value of call) if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
  });
});
