import type { FilteredRuntimePose, PoseLandmark2D, PoseLandmark3D, RawCanonicalPose } from "../pose";
import { JOINT_ANGLE_REGISTRY, getJointAngleDefinition } from "./jointAngleRegistry";
import type {
  FormalJointAngleResult, JointAngleAvailabilityReason, JointAngleCoordinateSpace,
  JointAngleDefinition, JointAngleMetricId, RuntimeJointAngleResult,
} from "./jointAngleTypes";

export const JOINT_ANGLE_ANALYSIS_PROFILE = Object.freeze({
  id: "joint-angle-analysis.v1",
  version: "1.0.0",
});

export const JOINT_ANGLE_VECTOR_EPSILON = Object.freeze({
  "normalized-2d": 1e-8,
  "world-3d": 1e-6,
});

type Point = readonly number[];
export type GeometricAngleResult =
  | Readonly<{ valueDegrees: number; reason: null }>
  | Readonly<{ valueDegrees: null; reason: "nonfinite-coordinate" | "zero-length-vector" }>;

export function computeUnsignedInternalAngle(
  a: Point,
  b: Point,
  c: Point,
  epsilon: number,
): GeometricAngleResult {
  if (a.length !== b.length || b.length !== c.length || (a.length !== 2 && a.length !== 3)) {
    return { valueDegrees: null, reason: "nonfinite-coordinate" };
  }
  if (![...a, ...b, ...c, epsilon].every(Number.isFinite) || epsilon <= 0) {
    return { valueDegrees: null, reason: "nonfinite-coordinate" };
  }
  const ba: number[] = [];
  const bc: number[] = [];
  for (let index = 0; index < a.length; index += 1) {
    ba.push(a[index] - b[index]);
    bc.push(c[index] - b[index]);
  }
  if (![...ba, ...bc].every(Number.isFinite)) {
    return { valueDegrees: null, reason: "nonfinite-coordinate" };
  }
  const baMagnitude = Math.hypot(...ba);
  const bcMagnitude = Math.hypot(...bc);
  if (baMagnitude <= epsilon || bcMagnitude <= epsilon) {
    return { valueDegrees: null, reason: "zero-length-vector" };
  }
  let normalizedDot = 0;
  for (let index = 0; index < ba.length; index += 1) {
    normalizedDot += (ba[index] / baMagnitude) * (bc[index] / bcMagnitude);
  }
  const cosine = Math.max(-1, Math.min(1, normalizedDot));
  const valueDegrees = Math.acos(cosine) * (180 / Math.PI);
  return Number.isFinite(valueDegrees)
    ? { valueDegrees, reason: null }
    : { valueDegrees: null, reason: "nonfinite-coordinate" };
}

type FormalLandmark = Readonly<{ id: number; x: number; y: number; z?: number; visibility?: number }>;
export type FormalAnglePoseFrame = Readonly<{
  timestampMs: number;
  frameIndex?: number;
  cameraSessionId?: number;
  landmarks2D: readonly FormalLandmark[];
  landmarks3D: readonly FormalLandmark[];
}>;

type SelectedInput = Readonly<{
  points: readonly [Point, Point, Point];
  coordinateSpace: JointAngleCoordinateSpace;
  confidence: number;
  sourceTimestampMs: number;
  degradedReason?: "held-runtime-landmark" | "outlier-rejected-runtime-landmark";
}>;
type SelectionFailure = Readonly<{ reason: JointAngleAvailabilityReason; confidence: number | null; coordinateSpace: JointAngleCoordinateSpace | null }>;
const FAILURE_PRIORITY: Readonly<Record<JointAngleAvailabilityReason, number>> = Object.freeze({
  "malformed-topology": 0, "missing-landmark": 1, "unavailable-runtime-landmark": 1,
  "nonfinite-coordinate": 2, "low-confidence": 3, "unsupported-coordinate-space": 4,
  "zero-length-vector": 5, "held-runtime-landmark": 6, "outlier-rejected-runtime-landmark": 6, "stale-pose": 0,
});

function coordinates(landmark: FormalLandmark, space: JointAngleCoordinateSpace): Point {
  return space === "world-3d" ? [landmark.x, landmark.y, landmark.z as number] : [landmark.x, landmark.y];
}

function minimumConfidence(landmarks: readonly FormalLandmark[]) {
  return Math.min(...landmarks.map((landmark) => landmark.visibility ?? 1));
}

function selectFormalInput(frame: FormalAnglePoseFrame, definition: JointAngleDefinition): SelectedInput | SelectionFailure {
  if (!definition.coordinatePolicy.formalAllowed.includes("world-3d")) return { reason: "unsupported-coordinate-space", confidence: null, coordinateSpace: null };
  const landmarks = definition.landmarks.map((id) => frame.landmarks3D[id]);
  if (landmarks.some((landmark) => !landmark)) return { reason: "unsupported-coordinate-space", confidence: null, coordinateSpace: "world-3d" };
  if (landmarks.some((landmark, index) => landmark!.id !== definition.landmarks[index])) return { reason: "malformed-topology", confidence: null, coordinateSpace: "world-3d" };
  if (landmarks.some((landmark) => ![landmark!.x, landmark!.y, landmark!.z].every(Number.isFinite))) return { reason: "nonfinite-coordinate", confidence: null, coordinateSpace: "world-3d" };
  const typed = landmarks as [FormalLandmark, FormalLandmark, FormalLandmark];
  const confidence = minimumConfidence(typed);
  if (!Number.isFinite(confidence) || confidence < definition.confidence.minimum) return { reason: "low-confidence", confidence: Number.isFinite(confidence) ? confidence : null, coordinateSpace: "world-3d" };
  return { points: typed.map((landmark) => coordinates(landmark, "world-3d")) as [Point, Point, Point], coordinateSpace: "world-3d", confidence, sourceTimestampMs: frame.timestampMs };
}

function tryRuntimeSpace(pose: FilteredRuntimePose, definition: JointAngleDefinition, space: JointAngleCoordinateSpace): SelectedInput | SelectionFailure {
  const collection = space === "world-3d" ? pose.landmarks3D : pose.landmarks2D;
  const quality = space === "world-3d" ? pose.landmarkQuality3D : pose.landmarkQuality;
  if (collection.length === 0) return { reason: "unsupported-coordinate-space", confidence: null, coordinateSpace: space };
  const landmarks = definition.landmarks.map((id) => collection[id]);
  const qualities = definition.landmarks.map((id) => quality[id]);
  if (landmarks.some((landmark) => landmark === null) || qualities.some((item) => item?.state === "unavailable")) return { reason: "unavailable-runtime-landmark", confidence: null, coordinateSpace: space };
  if (landmarks.some((landmark, index) => !landmark || landmark.id !== definition.landmarks[index]) || qualities.some((item, index) => !item || item.id !== definition.landmarks[index])) return { reason: "malformed-topology", confidence: null, coordinateSpace: space };
  const typed = landmarks as [Readonly<PoseLandmark2D | PoseLandmark3D>, Readonly<PoseLandmark2D | PoseLandmark3D>, Readonly<PoseLandmark2D | PoseLandmark3D>];
  if (typed.some((landmark) => !coordinates(landmark, space).every(Number.isFinite))) return { reason: "nonfinite-coordinate", confidence: null, coordinateSpace: space };
  const confidence = minimumConfidence(typed);
  if (!Number.isFinite(confidence) || confidence < definition.confidence.minimum) return { reason: "low-confidence", confidence: Number.isFinite(confidence) ? confidence : null, coordinateSpace: space };
  const held = qualities.some((item) => item!.state === "held");
  const outlier = qualities.some((item) => item!.state === "outlier-rejected");
  return {
    points: typed.map((landmark) => coordinates(landmark, space)) as [Point, Point, Point], coordinateSpace: space, confidence,
    sourceTimestampMs: Math.min(...qualities.map((item) => item!.sourceTimestampMs)),
    ...(held ? { degradedReason: "held-runtime-landmark" as const } : outlier ? { degradedReason: "outlier-rejected-runtime-landmark" as const } : {}),
  };
}

function definitionOrThrow(metricId: JointAngleMetricId) {
  const definition = getJointAngleDefinition(metricId);
  if (!definition) throw new Error(`Unknown joint-angle metric ID: ${metricId}`);
  return definition;
}

export function calculateRuntimeJointAngle(pose: FilteredRuntimePose, metricId: JointAngleMetricId, context: Readonly<{ poseAgeMs?: number; maximumPoseAgeMs?: number }> = {}): RuntimeJointAngleResult {
  const definition = definitionOrThrow(metricId);
  const base = { metricId, contractVersion: definition.contractVersion, provenance: "runtime-display" as const, runtimeProfileId: pose.runtimeProfileId, sourceTimestampMs: pose.timestampMs, ...(pose.frameIndex === undefined ? {} : { frameIndex: pose.frameIndex }), ...(pose.cameraSessionId === undefined ? {} : { cameraSessionId: pose.cameraSessionId }), inputLandmarkIds: definition.landmarks };
  if ((context.poseAgeMs ?? 0) > (context.maximumPoseAgeMs ?? 300)) return { ...base, status: "unavailable", reason: "stale-pose", valueDegrees: null, coordinateSpace: null, confidence: null };
  const spaces = definition.coordinatePolicy.realtimeAllowed;
  let failure: SelectionFailure = { reason: "unsupported-coordinate-space", confidence: null, coordinateSpace: null };
  for (const space of spaces) {
    const selected = tryRuntimeSpace(pose, definition, space);
    if (!("points" in selected)) {
      if (FAILURE_PRIORITY[selected.reason] < FAILURE_PRIORITY[failure.reason]) failure = selected;
      continue;
    }
    const geometry = computeUnsignedInternalAngle(...selected.points, JOINT_ANGLE_VECTOR_EPSILON[space]);
    if (geometry.valueDegrees === null) return { ...base, sourceTimestampMs: selected.sourceTimestampMs, status: "unavailable", reason: geometry.reason, valueDegrees: null, coordinateSpace: space, confidence: selected.confidence };
    if (selected.degradedReason) return { ...base, sourceTimestampMs: selected.sourceTimestampMs, status: "degraded", reason: selected.degradedReason, valueDegrees: geometry.valueDegrees, coordinateSpace: space, confidence: selected.confidence };
    return { ...base, sourceTimestampMs: selected.sourceTimestampMs, status: "available", valueDegrees: geometry.valueDegrees, coordinateSpace: space, confidence: selected.confidence };
  }
  return { ...base, status: "unavailable", reason: failure.reason, valueDegrees: null, coordinateSpace: failure.coordinateSpace, confidence: failure.confidence };
}

export function calculateFormalJointAngle(frame: FormalAnglePoseFrame | RawCanonicalPose, metricId: JointAngleMetricId): FormalJointAngleResult {
  const definition = definitionOrThrow(metricId);
  const selected = selectFormalInput(frame, definition);
  const base = { metricId, contractVersion: definition.contractVersion, provenance: "formal-analysis" as const, analysisProfileId: JOINT_ANGLE_ANALYSIS_PROFILE.id, analysisProfileVersion: JOINT_ANGLE_ANALYSIS_PROFILE.version, sourceTimestampMs: frame.timestampMs, ...(frame.frameIndex === undefined ? {} : { frameIndex: frame.frameIndex }), ...(frame.cameraSessionId === undefined ? {} : { cameraSessionId: frame.cameraSessionId }), inputLandmarkIds: definition.landmarks };
  if (!("points" in selected)) return { ...base, status: "unavailable", reason: selected.reason, valueDegrees: null, coordinateSpace: selected.coordinateSpace, confidence: selected.confidence };
  const geometry = computeUnsignedInternalAngle(...selected.points, JOINT_ANGLE_VECTOR_EPSILON[selected.coordinateSpace]);
  return geometry.valueDegrees === null
    ? { ...base, status: "unavailable", reason: geometry.reason, valueDegrees: null, coordinateSpace: selected.coordinateSpace, confidence: selected.confidence }
    : { ...base, status: "available", valueDegrees: geometry.valueDegrees, coordinateSpace: selected.coordinateSpace, confidence: selected.confidence };
}

export const calculateSelectedRuntimeJointAngles = (pose: FilteredRuntimePose, metricIds: readonly JointAngleMetricId[]) => Object.freeze(metricIds.map((id) => calculateRuntimeJointAngle(pose, id)));
export const calculateAllRuntimeJointAngles = (pose: FilteredRuntimePose) => calculateSelectedRuntimeJointAngles(pose, JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId));
export const calculateSelectedFormalJointAngles = (frame: FormalAnglePoseFrame | RawCanonicalPose, metricIds: readonly JointAngleMetricId[]) => Object.freeze(metricIds.map((id) => calculateFormalJointAngle(frame, id)));
export const calculateAllFormalJointAngles = (frame: FormalAnglePoseFrame | RawCanonicalPose) => calculateSelectedFormalJointAngles(frame, JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId));
