import { describe, expect, expectTypeOf, it } from "vitest";
import type { FilteredRuntimePose, RawCanonicalPose } from "../pose";
import { JOINT_ANGLE_REGISTRY } from "./jointAngleRegistry";
import type { FormalJointAngleResult } from "./jointAngleTypes";
import {
  JOINT_ANGLE_ANALYSIS_PROFILE, JOINT_ANGLE_VECTOR_EPSILON,
  calculateAllFormalJointAngles, calculateFormalJointAngle,
  calculateRuntimeJointAngle, calculateSelectedFormalJointAngles,
  computeUnsignedInternalAngle,
} from "./jointAngleComputation";

describe("Task 79 pure unsigned internal-angle geometry", () => {
  it.each([
    ["2D right", [0, 1], [0, 0], [1, 0], 90],
    ["3D right", [0, 1, 0], [0, 0, 0], [1, 0, 0], 90],
    ["straight", [-1, 0], [0, 0], [1, 0], 180],
    ["same direction", [1, 0], [0, 0], [2, 0], 0],
  ] as const)("computes %s", (_name, a, b, c, expected) => {
    expect(computeUnsignedInternalAngle(a, b, c, 1e-8).valueDegrees).toBeCloseTo(expected, 10);
  });

  it("is geometrically correct for very large near-parallel and antiparallel vectors", () => {
    const parallel = computeUnsignedInternalAngle([1e150, 1], [0, 0], [1e150, 0], 1e-8);
    const antiparallel = computeUnsignedInternalAngle([-1e150, 1], [0, 0], [1e150, 0], 1e-8);
    expect(parallel.valueDegrees).toBeCloseTo(0, 10);
    expect(antiparallel.valueDegrees).toBeCloseTo(180, 10);
    expect(Number.isFinite(parallel.valueDegrees)).toBe(true);
    expect(Number.isFinite(antiparallel.valueDegrees)).toBe(true);
  });

  it("keeps large finite 3D geometry correct", () => {
    const result = computeUnsignedInternalAngle([1e150, 0, 0], [0, 0, 0], [0, 1e150, 0], 1e-8);
    expect(result.valueDegrees).toBeCloseTo(90, 10);
    expect(Number.isFinite(result.valueDegrees)).toBe(true);
  });

  it("is invariant under very large and small above-epsilon scaling", () => {
    const angleAtScale = (scale: number) => computeUnsignedInternalAngle(
      [scale, 0], [0, 0], [scale * 0.5, scale * Math.sqrt(3) / 2], 1e-8,
    ).valueDegrees;
    const baseline = angleAtScale(1);
    expect(baseline).toBeCloseTo(60, 10);
    expect(angleAtScale(1e150)).toBeCloseTo(baseline!, 10);
    expect(angleAtScale(1e-7)).toBeCloseTo(baseline!, 10);
  });

  it("rejects zero, tiny, and nonfinite vectors with explicit reasons", () => {
    expect(computeUnsignedInternalAngle([0, 0], [0, 0], [1, 0], 1e-8)).toMatchObject({ valueDegrees: null, reason: "zero-length-vector" });
    expect(computeUnsignedInternalAngle([1, 0], [0, 0], [0, 0], 1e-8)).toMatchObject({ valueDegrees: null, reason: "zero-length-vector" });
    expect(computeUnsignedInternalAngle([1e-9, 0], [0, 0], [1, 0], JOINT_ANGLE_VECTOR_EPSILON["normalized-2d"])).toMatchObject({ valueDegrees: null, reason: "zero-length-vector" });
    expect(computeUnsignedInternalAngle([Number.NaN, 0], [0, 0], [1, 0], 1e-8)).toMatchObject({ valueDegrees: null, reason: "nonfinite-coordinate" });
  });
});

function rawFrame(metricId = JOINT_ANGLE_REGISTRY[0].metricId) {
  const definition = JOINT_ANGLE_REGISTRY.find((item) => item.metricId === metricId)!;
  const landmarks2D = Array.from({ length: 33 }, (_, id) => ({ id, x: id / 100, y: id / 100, visibility: 1 }));
  const landmarks3D = Array.from({ length: 33 }, (_, id) => ({ id, x: id / 100, y: id / 100, z: id / 100, visibility: 1 }));
  const [a, b, c] = definition.landmarks;
  Object.assign(landmarks2D[a], { x: 0, y: 1 }); Object.assign(landmarks2D[b], { x: 0, y: 0 }); Object.assign(landmarks2D[c], { x: 1, y: 0 });
  Object.assign(landmarks3D[a], { x: 0, y: 1, z: 0 }); Object.assign(landmarks3D[b], { x: 0, y: 0, z: 0 }); Object.assign(landmarks3D[c], { x: 1, y: 0, z: 0 });
  return { timestampMs: 100, frameIndex: 4, cameraSessionId: 7, landmarks2D, landmarks3D };
}

function runtimePose(metricId = JOINT_ANGLE_REGISTRY[0].metricId): FilteredRuntimePose {
  const frame = rawFrame(metricId);
  return {
    ...frame, engineName: "test", engineVersion: "1", runtimeProfileId: "runtime-visualization.stabilized.v1",
    landmarkQuality: Array.from({ length: 33 }, (_, id) => ({ id, state: "filtered" as const, sourceTimestampMs: 100 })),
    landmarkQuality3D: Array.from({ length: 33 }, (_, id) => ({ id, state: "filtered" as const, sourceTimestampMs: 100 })),
    qualityDiagnostics: { filtered: 66, held: 0, outliers: 0, unavailable: 0 },
  } as unknown as FilteredRuntimePose;
}

describe("Task 79 registry-driven formal computation", () => {
  it("computes every registry metric through its own ordered triplet", () => {
    for (const definition of JOINT_ANGLE_REGISTRY) {
      const result = calculateFormalJointAngle(rawFrame(definition.metricId), definition.metricId);
      expect(result).toMatchObject({ valueDegrees: 90, status: "available", coordinateSpace: "world-3d", inputLandmarkIds: definition.landmarks });
    }
  });

  it("requires world 3D and preserves formal provenance without mutating Raw input", () => {
    const frame = rawFrame();
    const snapshot = structuredClone(frame);
    const result = calculateFormalJointAngle(frame, JOINT_ANGLE_REGISTRY[0].metricId);
    expect(result).toMatchObject({ provenance: "formal-analysis", analysisProfileId: JOINT_ANGLE_ANALYSIS_PROFILE.id, analysisProfileVersion: "1.0.0", frameIndex: 4 });
    expect(result).not.toHaveProperty("runtimeProfileId");
    expect(frame).toEqual(snapshot);
    expect(calculateFormalJointAngle({ ...frame, landmarks3D: [] }, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ status: "unavailable", reason: "unsupported-coordinate-space", valueDegrees: null });
    expectTypeOf<Parameters<typeof calculateFormalJointAngle>[0]>().not.toMatchTypeOf<FilteredRuntimePose>();
    expectTypeOf<RawCanonicalPose>().toMatchTypeOf<Parameters<typeof calculateFormalJointAngle>[0]>();
  });

  it("preserves selected and registry order while isolating unavailable metrics", () => {
    const frame = rawFrame();
    const selectedIds = [JOINT_ANGLE_REGISTRY[1].metricId, JOINT_ANGLE_REGISTRY[0].metricId] as const;
    expect(calculateSelectedFormalJointAngles(frame, selectedIds).map(({ metricId }) => metricId)).toEqual(selectedIds);
    const incomplete = { ...frame, landmarks3D: [...frame.landmarks3D] };
    incomplete.landmarks3D[31] = undefined as never;
    const all = calculateAllFormalJointAngles(incomplete);
    expect(all.map(({ metricId }) => metricId)).toEqual(JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId));
    expect(Object.isFrozen(all)).toBe(true);
    expect(all.some(({ status }) => status === "unavailable")).toBe(true);
  });

  it("fails deterministically for an unknown programmer-supplied ID", () => {
    expect(() => calculateFormalJointAngle(rawFrame(), "joint-angle.unknown.internal.v1" as never)).toThrow(/Unknown/);
  });
});

describe("Task 79 runtime computation", () => {
  it("prefers world 3D, falls back wholly to 2D, and preserves identity", () => {
    const pose = runtimePose();
    expect(calculateRuntimeJointAngle(pose, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ status: "available", coordinateSpace: "world-3d", valueDegrees: 90, runtimeProfileId: pose.runtimeProfileId, frameIndex: 4, cameraSessionId: 7 });
    const fallback = { ...pose, landmarks3D: [], landmarkQuality3D: [] } as unknown as FilteredRuntimePose;
    expect(calculateRuntimeJointAngle(fallback, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ status: "available", coordinateSpace: "normalized-2d", valueDegrees: 90 });
  });

  it("applies held/outlier priority and oldest required source timestamp", () => {
    const pose = runtimePose();
    const [a, b] = JOINT_ANGLE_REGISTRY[0].landmarks;
    const quality = pose.landmarkQuality3D.map((item) => ({ ...item }));
    quality[a] = { id: a, state: "outlier-rejected", sourceTimestampMs: 90 };
    quality[b] = { id: b, state: "held", sourceTimestampMs: 40 };
    expect(calculateRuntimeJointAngle({ ...pose, landmarkQuality3D: quality } as unknown as FilteredRuntimePose, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ status: "degraded", reason: "held-runtime-landmark", sourceTimestampMs: 40 });
  });

  it("enforces null, confidence, malformed topology, valid zero, and stale policies", () => {
    const pose = runtimePose();
    const [a, b, c] = JOINT_ANGLE_REGISTRY[0].landmarks;
    const null2D = [...pose.landmarks2D]; const null3D = [...pose.landmarks3D]; null2D[b] = null; null3D[b] = null;
    expect(calculateRuntimeJointAngle({ ...pose, landmarks2D: null2D, landmarks3D: null3D } as unknown as FilteredRuntimePose, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ status: "unavailable", reason: "unavailable-runtime-landmark", valueDegrees: null });
    const low2D = pose.landmarks2D.map((item) => item ? { ...item } : null); const low3D = pose.landmarks3D.map((item) => item ? { ...item } : null);
    low2D[a]!.visibility = 0.1; low3D[a]!.visibility = 0.1;
    expect(calculateRuntimeJointAngle({ ...pose, landmarks2D: low2D, landmarks3D: low3D } as unknown as FilteredRuntimePose, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ reason: "low-confidence", confidence: 0.1 });
    const malformed = pose.landmarks3D.map((item) => item ? { ...item } : null); malformed[b]!.id = 99;
    expect(calculateRuntimeJointAngle({ ...pose, landmarks3D: malformed, landmarks2D: [] } as unknown as FilteredRuntimePose, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ reason: "malformed-topology" });
    const zero = runtimePose(); const two = zero.landmarks3D.map((item) => item ? { ...item } : null); Object.assign(two[a]!, { x: 1, y: 0 }); Object.assign(two[b]!, { x: 0, y: 0 }); Object.assign(two[c]!, { x: 2, y: 0 });
    expect(calculateRuntimeJointAngle({ ...zero, landmarks3D: two } as unknown as FilteredRuntimePose, JOINT_ANGLE_REGISTRY[0].metricId)).toMatchObject({ status: "available", valueDegrees: 0 });
    expect(calculateRuntimeJointAngle(pose, JOINT_ANGLE_REGISTRY[0].metricId, { poseAgeMs: 301 })).toMatchObject({ status: "unavailable", reason: "stale-pose" });
  });

  it("uses minimum A/B/C confidence", () => {
    const pose = runtimePose(); const landmarks = pose.landmarks3D.map((item) => item ? { ...item } : null);
    const [a, b, c] = JOINT_ANGLE_REGISTRY[0].landmarks; landmarks[a]!.visibility = 0.8; landmarks[b]!.visibility = 0.7; landmarks[c]!.visibility = 0.6;
    expect(calculateRuntimeJointAngle({ ...pose, landmarks3D: landmarks } as unknown as FilteredRuntimePose, JOINT_ANGLE_REGISTRY[0].metricId).confidence).toBe(0.6);
  });
});

const _formalResultContract: FormalJointAngleResult | null = null;
void _formalResultContract;
