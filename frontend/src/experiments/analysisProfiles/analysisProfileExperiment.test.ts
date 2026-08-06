import { describe, expect, expectTypeOf, it } from "vitest";
import { calculateFormalJointAngle, calculateRuntimeJointAngle, type JointAngleMetricId } from "../../engines/motionModel";
import { createRuntimePoseQualityEngine, mapPoseDetectionResultToRawCanonicalPose, type PoseDetectionResult, type RawCanonicalPose } from "../../engines/pose";
import { CAUSAL_REPLAY_FINAL_CANDIDATE, NON_CAUSAL_FINAL_CANDIDATE, RAW_FRAME_LOCAL_FINAL_CANDIDATE, REALTIME_DISPLAY_CANDIDATE, validateCandidateProfile, type FinalAnalysisProfile, type RealtimeDisplayProfile } from "./candidateProfiles";
import { evaluateFinalCandidate, smoothAngleSeries, validateRawPoseSequence } from "./analysisProfileExperiment";

const METRIC = "joint-angle.left-knee.internal.v1" satisfies JointAngleMetricId;

function pose(angleDegrees: number, frameIndex: number, options: { session?: number; visibility?: number; world?: boolean; timestampMs?: number } = {}): RawCanonicalPose {
  const radians = angleDegrees * Math.PI / 180;
  const base = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: id / 100, y: id / 200, visibility: options.visibility ?? 0.99 }));
  base[23] = { id: 23, name: "left_hip", x: 1, y: 0, visibility: options.visibility ?? 0.99 };
  base[25] = { id: 25, name: "left_knee", x: 0, y: 0, visibility: options.visibility ?? 0.99 };
  base[27] = { id: 27, name: "left_ankle", x: Math.cos(radians), y: Math.sin(radians), visibility: options.visibility ?? 0.99 };
  const result: PoseDetectionResult = { engineName: "synthetic", engineVersion: "1", timestampMs: options.timestampMs ?? frameIndex * 33, frameIndex, landmarks2D: base, landmarks3D: options.world === false ? [] : base.map((point) => ({ ...point, z: 0 })) };
  return mapPoseDetectionResultToRawCanonicalPose(result, { sourceTimestampMs: result.timestampMs, frameIndex, cameraSessionId: options.session ?? 1 });
}

describe("Task 83 candidate profile contracts", () => {
  it("keeps realtime and final contracts discriminated and immutable", () => {
    expectTypeOf<RealtimeDisplayProfile>().not.toEqualTypeOf<FinalAnalysisProfile>();
    expect(REALTIME_DISPLAY_CANDIDATE).toMatchObject({ kind: "realtime-display", causal: true, usesFutureFrames: false, persistenceEligible: false });
    expect(NON_CAUSAL_FINAL_CANDIDATE).toMatchObject({ kind: "final-analysis", causal: false, usesFutureFrames: true, persistenceEligible: false });
    expect(Object.isFrozen(REALTIME_DISPLAY_CANDIDATE)).toBe(true);
    expect(Object.isFrozen(NON_CAUSAL_FINAL_CANDIDATE.smoothing)).toBe(true);
  });

  it("rejects contradictory runtime and non-causal declarations", () => {
    expect(() => validateCandidateProfile({ ...REALTIME_DISPLAY_CANDIDATE, usesFutureFrames: true } as unknown as RealtimeDisplayProfile)).toThrow("contradictory");
    expect(() => validateCandidateProfile({ ...NON_CAUSAL_FINAL_CANDIDATE, causal: true } as unknown as FinalAnalysisProfile)).toThrow("must explicitly use future");
  });
});

describe("Task 83 deterministic sequence rules", () => {
  it("accepts empty, single, ordered, gapped, irregular, and session-bounded input", () => {
    expect(validateRawPoseSequence([])).toEqual([]);
    expect(validateRawPoseSequence([pose(90, 1)])).toHaveLength(1);
    expect(validateRawPoseSequence([pose(90, 1), pose(90, 3, { timestampMs: 91 }), pose(90, 1, { session: 2, timestampMs: 120 })])).toHaveLength(3);
  });

  it("fails fast for duplicate or out-of-order identity", () => {
    expect(() => validateRawPoseSequence([pose(90, 1), pose(90, 1)])).toThrow("Duplicate or out-of-order");
    expect(() => validateRawPoseSequence([pose(90, 2), pose(90, 1)])).toThrow("Duplicate or out-of-order");
    expect(() => validateRawPoseSequence([pose(90, 1), pose(90, 2, { timestampMs: 33 })])).toThrow("Duplicate or out-of-order");
  });

  it("is deterministic and never mutates Raw input", () => {
    const input = Object.freeze([pose(88, 1), pose(92, 2), pose(89, 3)]);
    const before = JSON.stringify(input);
    const first = evaluateFinalCandidate(NON_CAUSAL_FINAL_CANDIDATE, input, [METRIC], [90, 90, 90]);
    const second = evaluateFinalCandidate(NON_CAUSAL_FINAL_CANDIDATE, input, [METRIC], [90, 90, 90]);
    expect(first.samples).toEqual(second.samples);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("Task 83 realtime and final fixtures", () => {
  it("raw frame-local preserves exact 0/90 truth and metric order", () => {
    const zero = calculateFormalJointAngle(pose(0, 1), METRIC);
    expect(zero).toMatchObject({ status: "available", valueDegrees: 0, coordinateSpace: "world-3d" });
    const report = evaluateFinalCandidate(RAW_FRAME_LOCAL_FINAL_CANDIDATE, [pose(90, 1)], [METRIC], [90]);
    expect(report).toMatchObject({ validCount: 1, unavailableCount: 0, meanAbsoluteError: 0, maximumAbsoluteError: 0 });
    expect(report.samples.map(({ metricId }) => metricId)).toEqual([METRIC]);
  });

  it("reports noisy synthetic truth error, coverage, and bounded timing fields", () => {
    const report = evaluateFinalCandidate(RAW_FRAME_LOCAL_FINAL_CANDIDATE, [pose(88, 1), pose(92, 2), pose(89, 3)], [METRIC], [90, 90, 90]);
    expect(report.validCount).toBe(3);
    expect(report.meanAbsoluteError).toBeCloseTo(5 / 3);
    expect(report.maximumAbsoluteError).toBeCloseTo(2);
    expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("enforces formal world-3D and does not convert unavailable to zero", () => {
    const report = evaluateFinalCandidate(NON_CAUSAL_FINAL_CANDIDATE, [pose(90, 1), pose(90, 2, { world: false }), pose(90, 3)], [METRIC]);
    expect(report.samples.map(({ valueDegrees }) => valueDegrees)).toEqual([90, null, 90]);
    expect(report).toMatchObject({ validCount: 2, unavailableCount: 1, degradedCount: 0 });
  });

  it("resets causal smoothing and never smooths across camera sessions", () => {
    const report = evaluateFinalCandidate(CAUSAL_REPLAY_FINAL_CANDIDATE, [pose(30, 1), pose(150, 2), pose(30, 1, { session: 2, timestampMs: 100 })], [METRIC]);
    expect(report.samples[1].valueDegrees).not.toBeCloseTo(150);
    expect(report.samples[2].cameraSessionId).toBe(2);
    expect(report.samples[2].valueDegrees).toBeCloseTo(30);
  });

  it("shows causal transition lag and non-causal future-frame influence", () => {
    const sequence = [pose(30, 1), pose(30, 2), pose(150, 3), pose(150, 4)];
    const causal = evaluateFinalCandidate(CAUSAL_REPLAY_FINAL_CANDIDATE, sequence, [METRIC]);
    const centered = evaluateFinalCandidate(NON_CAUSAL_FINAL_CANDIDATE, sequence, [METRIC]);
    expect(causal.samples[2].valueDegrees).not.toBeCloseTo(150);
    expect(centered.samples[1].valueDegrees).not.toBeCloseTo(30);
    expect(centered.samples.every(({ valueDegrees }) => valueDegrees === null || Number.isFinite(valueDegrees))).toBe(true);
  });

  it("keeps interpolation separate and preserves missing samples in angle smoothing", () => {
    expect(smoothAngleSeries([90, null, 90])).toEqual([90, null, 90]);
    expect(smoothAngleSeries([0, 90, 180])).toEqual([45, 90, 135]);
  });

  it("demonstrates coordinate smoothing is not assumed equal to angle-series smoothing", () => {
    const sequence = [pose(20, 1), pose(80, 2), pose(160, 3)];
    const landmarkFirst = evaluateFinalCandidate(NON_CAUSAL_FINAL_CANDIDATE, sequence, [METRIC]).samples.map(({ valueDegrees }) => valueDegrees);
    const angleFirst = smoothAngleSeries([20, 80, 160]);
    expect(landmarkFirst).not.toEqual(angleFirst);
  });

  it("Task 77 reduces alternating jitter, holds briefly, expires, and resets sessions", () => {
    const engine = createRuntimePoseQualityEngine();
    const filtered = [pose(88, 1), pose(92, 2), pose(88, 3), pose(92, 4)].map((frame) => engine.transform(frame)!);
    const rawValues = [88, 92, 88, 92];
    const filteredValues = filtered.map((frame) => calculateRuntimeJointAngle(frame, METRIC).valueDegrees!);
    expect(Math.max(...filteredValues) - Math.min(...filteredValues)).toBeLessThan(Math.max(...rawValues) - Math.min(...rawValues));
    const low = pose(90, 5, { visibility: 0.1 });
    expect(calculateRuntimeJointAngle(engine.transform(low)!, METRIC).status).toBe("degraded");
    expect(calculateRuntimeJointAngle(engine.transform(pose(90, 6, { visibility: 0.1 }))!, METRIC).status).toBe("degraded");
    expect(calculateRuntimeJointAngle(engine.transform(pose(90, 10, { visibility: 0.1 }))!, METRIC).status).toBe("unavailable");
    expect(calculateRuntimeJointAngle(engine.transform(pose(30, 1, { session: 2, timestampMs: 400 }))!, METRIC).valueDegrees).toBeCloseTo(30);
  });
});
