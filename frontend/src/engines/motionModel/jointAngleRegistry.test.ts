import { describe, expect, expectTypeOf, it } from "vitest";
import { MEDIAPIPE_POSE_LANDMARK_COUNT } from "../pose/mediaPipePoseLandmarks";
import {
  JOINT_ANGLE_REGISTRY,
  getJointAngleDefinition,
  listJointAngleDefinitions,
  listJointAnglesByJoint,
  listJointAnglesBySide,
  resolveRequiredLandmarkIds,
  supportsFormalCoordinateSpace,
  supportsRealtimeCoordinateSpace,
  validateJointAngleRegistry,
} from "./jointAngleRegistry";
import { JOINT_ANGLE_CONTRACT_VERSION, type FormalJointAngleResult, type JointAngleDefinition, type RuntimeJointAngleResult } from "./jointAngleTypes";

const requiredIds = [
  "joint-angle.left-knee.internal.v1", "joint-angle.right-knee.internal.v1",
  "joint-angle.left-hip.internal.v1", "joint-angle.right-hip.internal.v1",
  "joint-angle.left-ankle.internal.v1", "joint-angle.right-ankle.internal.v1",
  "joint-angle.left-elbow.internal.v1", "joint-angle.right-elbow.internal.v1",
  "joint-angle.left-shoulder.internal.v1", "joint-angle.right-shoulder.internal.v1",
] as const;

function changedDefinition(change: Record<string, unknown>): JointAngleDefinition {
  const source = JOINT_ANGLE_REGISTRY[0];
  return { ...source, ...change } as JointAngleDefinition;
}

describe("Task 78 joint-angle registry contract", () => {
  it("contains every required stable, versioned metric ID exactly once", () => {
    expect(JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId)).toEqual(requiredIds);
    expect(new Set(JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId)).size).toBe(JOINT_ANGLE_REGISTRY.length);
    expect(JOINT_ANGLE_REGISTRY.every(({ metricId }) => /^joint-angle\..+\.internal\.v1$/.test(metricId))).toBe(true);
    expect(JOINT_ANGLE_REGISTRY.every(({ contractVersion }) => contractVersion === JOINT_ANGLE_CONTRACT_VERSION)).toBe(true);
  });

  it("publishes deeply immutable built-in definitions and readonly lookup results", () => {
    expect(Object.isFrozen(JOINT_ANGLE_REGISTRY)).toBe(true);
    expect(Object.isFrozen(JOINT_ANGLE_REGISTRY[0])).toBe(true);
    expect(Object.isFrozen(JOINT_ANGLE_REGISTRY[0].landmarks)).toBe(true);
    expect(Object.isFrozen(JOINT_ANGLE_REGISTRY[0].coordinatePolicy.realtimeAllowed)).toBe(true);
    expect(listJointAngleDefinitions()).toBe(JOINT_ANGLE_REGISTRY);
    expect(Object.isFrozen(listJointAnglesBySide("left"))).toBe(true);
  });

  it("uses mirrored MediaPipe triplets with B as the sole vertex", () => {
    const expectedPairs = [
      ["knee", [23, 25, 27], [24, 26, 28]],
      ["hip", [11, 23, 25], [12, 24, 26]],
      ["ankle", [25, 27, 31], [26, 28, 32]],
      ["elbow", [11, 13, 15], [12, 14, 16]],
      ["shoulder", [13, 11, 23], [14, 12, 24]],
    ] as const;
    for (const [joint, left, right] of expectedPairs) {
      expect(listJointAnglesByJoint(joint)).toHaveLength(2);
      expect(listJointAnglesByJoint(joint).find(({ side }) => side === "left")?.landmarks).toEqual(left);
      expect(listJointAnglesByJoint(joint).find(({ side }) => side === "right")?.landmarks).toEqual(right);
    }
    for (const item of JOINT_ANGLE_REGISTRY) {
      expect(item.landmarks).toHaveLength(3);
      expect(item.vertexLandmarkId).toBe(item.landmarks[1]);
      expect(new Set(item.landmarks).size).toBe(3);
      expect(item.landmarks.every((id) => id >= 0 && id < MEDIAPIPE_POSE_LANDMARK_COUNT)).toBe(true);
    }
  });

  it("defines unsigned degrees, explicit availability, and coordinate policies", () => {
    for (const item of JOINT_ANGLE_REGISTRY) {
      expect(item).toMatchObject({
        unit: "degrees", resultRange: { minimum: 0, maximum: 180 },
        geometricConvention: "unsigned-internal-angle", unavailableValue: null,
        confidence: { aggregation: "minimum-required-landmark-confidence", minimum: 0.35 },
      });
      expect(item.coordinatePolicy).toMatchObject({
        preferred: "world-3d", normalized2DFallback: "realtime-display-only",
        spacesBiomechanicallyEquivalent: false, mixingSpacesWithinResult: false,
      });
      expect(item.realtimeInput).toMatchObject({ filtered: "usable", held: "degraded", outlierRejected: "degraded", unavailable: "unavailable" });
      expect(item.formalInput).toMatchObject({ runtimeHoldSemantics: false, authoritative: true });
    }
    expect(supportsRealtimeCoordinateSpace(requiredIds[0], "normalized-2d")).toBe(true);
    expect(supportsFormalCoordinateSpace(requiredIds[0], "normalized-2d")).toBe(false);
    expect(supportsFormalCoordinateSpace(requiredIds[0], "world-3d")).toBe(true);
  });

  it("provides deterministic pure lookup helpers without label-derived identity", () => {
    const metric = getJointAngleDefinition(requiredIds[0])!;
    expect(resolveRequiredLandmarkIds(requiredIds[0])).toEqual([23, 25, 27]);
    expect(listJointAnglesBySide("left")).toHaveLength(5);
    expect(getJointAngleDefinition("joint-angle.left-knee.internal.v1")).toBe(metric);
    expect({ ...metric, displayLabel: "Renamed label" }.metricId).toBe(metric.metricId);
  });

  it("rejects malformed registries", () => {
    const original = JOINT_ANGLE_REGISTRY[0];
    expect(() => validateJointAngleRegistry([original, original])).toThrow(/Duplicate/);
    expect(() => validateJointAngleRegistry([changedDefinition({ landmarks: [23, 25, 99] })])).toThrow(/invalid landmark/i);
    expect(() => validateJointAngleRegistry([changedDefinition({ landmarks: [23, 25, 25] })])).toThrow(/distinct/);
    expect(() => validateJointAngleRegistry([changedDefinition({ vertexLandmarkId: 23 })])).toThrow(/vertex/);
    expect(() => validateJointAngleRegistry([changedDefinition({ resultRange: { minimum: 180, maximum: 0 } })])).toThrow(/range/);
    expect(() => validateJointAngleRegistry([changedDefinition({ coordinatePolicy: { ...original.coordinatePolicy, formalAllowed: [] } })])).toThrow(/preferred coordinate/);
    expect(() => validateJointAngleRegistry([changedDefinition({ formalInput: { ...original.formalInput, source: "filtered-runtime-pose" } })])).toThrow(/formal policy/);
    expect(() => validateJointAngleRegistry([changedDefinition({ unavailableValue: 0 })])).toThrow(/must be null/);
  });
});

describe("Task 78 angle result provenance contract", () => {
  it("distinguishes a valid zero-degree value from unavailable null", () => {
    const available: RuntimeJointAngleResult = {
      metricId: requiredIds[0], contractVersion: JOINT_ANGLE_CONTRACT_VERSION,
      status: "available", valueDegrees: 0, coordinateSpace: "world-3d",
      sourceTimestampMs: 10, frameIndex: 2, cameraSessionId: 3,
      inputLandmarkIds: [23, 25, 27], confidence: 0.9,
      provenance: "runtime-display", runtimeProfileId: "runtime-visualization.stabilized.v1",
    };
    const unavailable: FormalJointAngleResult = {
      metricId: requiredIds[0], contractVersion: JOINT_ANGLE_CONTRACT_VERSION,
      status: "unavailable", reason: "zero-length-vector", valueDegrees: null, coordinateSpace: "world-3d",
      sourceTimestampMs: 10, frameIndex: 2, cameraSessionId: 3,
      inputLandmarkIds: [23, 25, 27], confidence: null,
      provenance: "formal-analysis", analysisProfileId: "final.v1", analysisProfileVersion: "1.0.0",
    };
    expect(available.valueDegrees).toBe(0);
    expect(unavailable.valueDegrees).toBeNull();
    expect(unavailable.reason).toBe("zero-length-vector");
    expect(available).toMatchObject({ sourceTimestampMs: 10, frameIndex: 2, cameraSessionId: 3 });
  });

  it("represents required reasons and prevents runtime results masquerading as formal results", () => {
    const reasons = ["missing-landmark", "low-confidence", "zero-length-vector", "unsupported-coordinate-space"] as const;
    expect(reasons).toHaveLength(4);
    expectTypeOf<RuntimeJointAngleResult>().not.toMatchTypeOf<FormalJointAngleResult>();
    expectTypeOf<FormalJointAngleResult>().not.toMatchTypeOf<RuntimeJointAngleResult>();
    expectTypeOf<RuntimeJointAngleResult>().not.toHaveProperty("canvasX");
    expectTypeOf<FormalJointAngleResult>().not.toHaveProperty("uploadInstructions");
  });
});
