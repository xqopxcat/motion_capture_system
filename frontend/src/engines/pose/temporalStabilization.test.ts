import { describe, expect, it } from "vitest";
import { mapPoseDetectionResultToRawCanonicalPose } from "./rawCanonicalPose";
import { lowPassAlpha, OneEuroScalarFilter } from "./oneEuroFilter";
import { createRuntimePoseQualityEngine } from "./runtimePoseQuality";
import { STABILIZED_RUNTIME_POSE_PROFILE } from "./stabilizationProfile";

function rawPose(timestampMs: number, options: { x?: number; y?: number; visibility?: number; session?: number; worldX?: number } = {}) {
  const landmarks2D = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: id === 11 ? options.x ?? 0.5 : 0.5, y: id === 11 ? options.y ?? 0.5 : 0.5, visibility: id === 11 ? options.visibility ?? 1 : 1 }));
  const landmarks3D = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: id === 11 ? options.worldX ?? 0.2 : 0.2, y: 0.3, z: 0.4, visibility: id === 11 ? options.visibility ?? 1 : 1 }));
  return mapPoseDetectionResultToRawCanonicalPose({ engineName: "test", engineVersion: "1", timestampMs, frameIndex: timestampMs, landmarks2D, landmarks3D }, { sourceTimestampMs: timestampMs, frameIndex: timestampMs, cameraSessionId: options.session ?? 1 });
}

function landmarkX(pose: ReturnType<ReturnType<typeof createRuntimePoseQualityEngine>["transform"]>, id = 11) {
  return pose?.landmarks2D.find((landmark) => landmark?.id === id)?.x;
}

function rms(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

describe("One Euro scalar primitive", () => {
  it("calculates deterministic low-pass alpha and supports irregular intervals", () => {
    expect(lowPassAlpha(1, 0.1)).toBeCloseTo(0.385869, 5);
    const filter = new OneEuroScalarFilter({ minCutoffHz: 1, beta: 0, derivativeCutoffHz: 1 });
    expect(filter.filter(0, 0)).toBe(0);
    const short = filter.filter(1, 20);
    const long = filter.filter(1, 120);
    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
  });

  it("rejects invalid parameters and samples without mutating state", () => {
    expect(() => new OneEuroScalarFilter({ minCutoffHz: 0, beta: 0, derivativeCutoffHz: 1 })).toThrow();
    expect(() => new OneEuroScalarFilter({ minCutoffHz: 1, beta: Number.NaN, derivativeCutoffHz: 1 })).toThrow();
    const filter = new OneEuroScalarFilter({ minCutoffHz: 1, beta: 0, derivativeCutoffHz: 1 });
    expect(filter.filter(2, 10)).toBe(2);
    expect(() => filter.filter(Number.NaN, 20)).toThrow();
    expect(filter.filter(3, 10)).toBe(2);
    expect(() => filter.filter(3, 9)).toThrow("regression");
  });
});

describe("stabilized runtime Pose engine", () => {
  it("reduces deterministic stationary jitter and preserves Raw input", () => {
    const engine = createRuntimePoseQualityEngine();
    const rawValues: number[] = [];
    const filteredValues: number[] = [];
    const pattern = [-0.02, 0.018, -0.015, 0.02, -0.018, 0.014];
    for (let index = 0; index < 60; index += 1) {
      const x = 0.5 + pattern[index % pattern.length];
      const raw = rawPose(index * 33, { x });
      const before = raw.landmarks2D[11].x;
      rawValues.push(before);
      filteredValues.push(landmarkX(engine.transform(raw))!);
      expect(raw.landmarks2D[11].x).toBe(before);
    }
    expect(rms(filteredValues)).toBeLessThan(rms(rawValues) * 0.55);
    expect(engine.snapshotDiagnostics().rawFilteredDisplacement2D.count).toBeLessThanOrEqual(300);
  });

  it("adapts responsiveness, smooths slow motion, and follows sustained fast motion", () => {
    const staticFilter = new OneEuroScalarFilter(STABILIZED_RUNTIME_POSE_PROFILE.oneEuro);
    staticFilter.filter(0, 0);
    const staticResponse = staticFilter.filter(0.05, 33);
    const fastFilter = new OneEuroScalarFilter(STABILIZED_RUNTIME_POSE_PROFILE.oneEuro);
    fastFilter.filter(0, 0);
    const fastResponse = fastFilter.filter(0.2, 33);
    expect(fastResponse / 0.2).toBeGreaterThan(staticResponse / 0.05);

    const engine = createRuntimePoseQualityEngine();
    const outputs = Array.from({ length: 12 }, (_, index) => landmarkX(engine.transform(rawPose(index * 50, { x: 0.3 + index * 0.015 })))!);
    expect(outputs.at(-1)).toBeGreaterThan(outputs[0]);
    expect(outputs.at(-1)!).toBeLessThan(0.3 + 11 * 0.015);
  });

  it("rejects a time-aware spike but eventually accepts sustained movement", () => {
    const engine = createRuntimePoseQualityEngine();
    engine.transform(rawPose(0, { x: 0.5 }));
    const spike = engine.transform(rawPose(33, { x: 0.9 }))!;
    expect(landmarkX(spike)).toBe(0.5);
    expect(spike.landmarkQuality[11].state).toBe("outlier-rejected");
    engine.transform(rawPose(66, { x: 0.9 }));
    const accepted = engine.transform(rawPose(99, { x: 0.9 }))!;
    expect(landmarkX(accepted)).toBeGreaterThan(0.65);
    expect(landmarkX(accepted)).toBeLessThan(0.9);
    expect(accepted.landmarkQuality[11].state).toBe("filtered");
  });

  it("holds low-confidence landmarks within bounds, then removes and recovers them", () => {
    const engine = createRuntimePoseQualityEngine();
    engine.transform(rawPose(0, { x: 0.5 }));
    for (const timestamp of [33, 66, 99]) {
      const held = engine.transform(rawPose(timestamp, { x: 0.1, visibility: 0.1 }))!;
      expect(landmarkX(held)).toBe(0.5);
      expect(held.landmarkQuality[11].state).toBe("held");
      expect(held.landmarkQuality[11].sourceTimestampMs).toBe(0);
    }
    const unavailable = engine.transform(rawPose(132, { visibility: 0.1 }))!;
    expect(unavailable.landmarks2D).toHaveLength(33);
    expect(unavailable.landmarks3D).toHaveLength(33);
    expect(unavailable.landmarks2D[13]?.id).toBe(13);
    expect(landmarkX(unavailable)).toBeUndefined();
    expect(unavailable.landmarks2D[11]).toBeNull();
    expect(unavailable.landmarks3D[11]).toBeNull();
    expect(unavailable.landmarkQuality[11].state).toBe("unavailable");
    expect(unavailable.landmarkQuality3D[11].state).toBe("unavailable");
    expect(unavailable.landmarks2D.every((landmark, index) => landmark === null || landmark.id === index)).toBe(true);
    expect(unavailable.landmarks3D.every((landmark, index) => landmark === null || landmark.id === index)).toBe(true);
    const recovered = engine.transform(rawPose(165, { x: 0.55 }))!;
    expect(recovered.landmarks2D[11]?.id).toBe(11);
    expect(landmarkX(recovered)).toBe(0.55);
    expect(recovered.landmarkQuality[11].state).toBe("filtered");
  });

  it("isolates landmark, coordinate, collection, and camera-session state", () => {
    const engine = createRuntimePoseQualityEngine();
    engine.transform(rawPose(0, { x: 0.4, y: 0.4, worldX: 0.1, session: 1 }));
    const next = engine.transform(rawPose(33, { x: 0.42, y: 0.4, worldX: 0.12, session: 1 }))!;
    expect(next.landmarks2D[12]!.x).toBe(0.5);
    expect(next.landmarks2D[11]!.y).toBe(0.4);
    expect(next.landmarks3D[11]!.x).not.toBe(next.landmarks2D[11]!.x);
    const changedSession = engine.transform(rawPose(66, { x: 0.8, session: 2 }))!;
    expect(landmarkX(changedSession)).toBe(0.8);
    expect(engine.snapshotDiagnostics().resets["session-change"]).toBe(1);
  });

  it("resets on regression and excessive gaps, disposes state, and bounds diagnostics", () => {
    const engine = createRuntimePoseQualityEngine();
    engine.transform(rawPose(100, { x: 0.4 }));
    expect(landmarkX(engine.transform(rawPose(90, { x: 0.6 })))).toBe(0.6);
    expect(engine.snapshotDiagnostics().resets["timestamp-regression"]).toBe(1);
    expect(landmarkX(engine.transform(rawPose(500, { x: 0.7 })))).toBe(0.7);
    expect(engine.snapshotDiagnostics().resets["excessive-gap"]).toBe(1);
    expect(engine.snapshotDiagnostics().timestampGaps).toBe(1);
    engine.dispose();
    expect(engine.snapshotDiagnostics().retainedLandmarkStateCount).toBe(0);
    expect(() => engine.transform(rawPose(533))).toThrow("disposed");
  });

  it("records explicit Capture lifecycle resets and never leaks prior state", () => {
    const engine = createRuntimePoseQualityEngine();
    engine.transform(rawPose(0, { x: 0.4 }));
    for (const reason of ["camera-flip", "retake", "inference-error"] as const) {
      engine.reset(reason);
      expect(engine.snapshotDiagnostics().retainedLandmarkStateCount).toBe(0);
      expect(engine.snapshotDiagnostics().resets[reason]).toBe(1);
      expect(landmarkX(engine.transform(rawPose(engine.snapshotDiagnostics().rawInputCount * 100, { x: 0.7 })))).toBe(0.7);
    }
  });

  it("reports bounded quality diagnostics without angle or metric fields", () => {
    const engine = createRuntimePoseQualityEngine();
    const output = engine.transform(rawPose(0))!;
    const diagnostics = engine.snapshotDiagnostics();
    expect(output.runtimeProfileId).toBe("runtime-visualization.stabilized.v1");
    expect(output.landmarks2D).toHaveLength(33);
    expect(output.landmarks3D).toHaveLength(33);
    expect(output.landmarkQuality).toHaveLength(33);
    expect(output.landmarkQuality3D).toHaveLength(33);
    expect(output).not.toHaveProperty("angles");
    expect(output).not.toHaveProperty("metricSeries");
    expect(diagnostics).toMatchObject({ rawInputCount: 1, stabilizedOutputCount: 1, landmarksFiltered: 66 });
    expect(diagnostics.processingDurationMs.count).toBe(1);
  });

  it("rejects nonfinite stabilization profile parameters", () => {
    expect(() => createRuntimePoseQualityEngine({
      ...STABILIZED_RUNTIME_POSE_PROFILE,
      oneEuro: { ...STABILIZED_RUNTIME_POSE_PROFILE.oneEuro, beta: Number.NaN },
    })).toThrow("beta");
  });

  it("reports deterministic synthetic quality evidence", () => {
    const staticEngine = createRuntimePoseQualityEngine();
    const pattern = [-0.02, 0.018, -0.015, 0.02, -0.018, 0.014];
    const rawStatic = Array.from({ length: 120 }, (_, index) => 0.5 + pattern[index % pattern.length]);
    const filteredStatic = rawStatic.map((x, index) => landmarkX(staticEngine.transform(rawPose(index * 33, { x })))!);
    const rawJitter = rms(rawStatic);
    const filteredJitter = rms(filteredStatic);

    const movementEngine = createRuntimePoseQualityEngine();
    const movement = Array.from({ length: 30 }, (_, index) => 0.25 + index * 0.01);
    const movementOutput = movement.map((x, index) => landmarkX(movementEngine.transform(rawPose(index * 50, { x })))!);
    const maximumLag = Math.max(...movement.map((value, index) => Math.abs(value - movementOutput[index])));
    const diagnostics = staticEngine.snapshotDiagnostics();
    const report = {
      rawJitter,
      filteredJitter,
      jitterReductionPercent: (1 - filteredJitter / rawJitter) * 100,
      maximumSlowMovementLag: maximumLag,
      processingMeanMs: diagnostics.processingDurationMs.mean,
      processingMaxMs: diagnostics.processingDurationMs.max,
    };
    console.info("TASK_77_SYNTHETIC_EVIDENCE", JSON.stringify(report));
    expect(report.jitterReductionPercent).toBeGreaterThan(45);
    expect(report.maximumSlowMovementLag).toBeLessThan(0.08);
    expect(report.processingMeanMs).not.toBeNull();
  });
});
