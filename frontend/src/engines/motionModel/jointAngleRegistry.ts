import {
  JOINT_ANGLE_CONTRACT_VERSION,
  type JointAngleCoordinateSpace,
  type JointAngleDefinition,
  type JointAngleJoint,
  type JointAngleMetricId,
  type JointAngleSide,
} from "./jointAngleTypes";
import { MEDIAPIPE_POSE_LANDMARK_COUNT } from "../pose/mediaPipePoseLandmarks";

const ids = {
  leftShoulder: 11, rightShoulder: 12, leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16, leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26, leftAnkle: 27, rightAnkle: 28,
  leftFootIndex: 31, rightFootIndex: 32,
} as const;

const coordinatePolicy = Object.freeze({
  preferred: "world-3d" as const,
  realtimeAllowed: Object.freeze(["world-3d", "normalized-2d"] as const),
  formalAllowed: Object.freeze(["world-3d"] as const),
  normalized2DFallback: "realtime-display-only" as const,
  spacesBiomechanicallyEquivalent: false as const,
  mixingSpacesWithinResult: false as const,
});

const realtimeInput = Object.freeze({
  source: "filtered-runtime-pose" as const, authoritative: false as const,
  filtered: "usable" as const, held: "degraded" as const,
  outlierRejected: "degraded" as const, unavailable: "unavailable" as const,
});

const formalInput = Object.freeze({
  source: "raw-canonical-pose-or-persisted-pose.v1" as const,
  preprocessing: "approved-versioned-analysis-profile" as const,
  runtimeHoldSemantics: false as const, authoritative: true as const,
});

function definition(
  metricId: JointAngleMetricId,
  displayLabel: string,
  side: "left" | "right",
  joint: JointAngleJoint,
  landmarks: readonly [number, number, number],
  tags: readonly string[],
): JointAngleDefinition {
  return Object.freeze({
    metricId, contractVersion: JOINT_ANGLE_CONTRACT_VERSION, displayLabel, side, joint,
    landmarks: Object.freeze([...landmarks]) as unknown as readonly [number, number, number],
    vertexLandmarkId: landmarks[1], unit: "degrees", resultRange: Object.freeze({ minimum: 0, maximum: 180 }),
    geometricConvention: "unsigned-internal-angle", coordinatePolicy, realtimeInput, formalInput,
    confidence: Object.freeze({ aggregation: "minimum-required-landmark-confidence", minimum: 0.35 }),
    unavailableValue: null, tags: Object.freeze([...tags]), deprecated: false,
  });
}

const builtInDefinitions = [
  definition("joint-angle.left-knee.internal.v1", "Left knee internal angle", "left", "knee", [ids.leftHip, ids.leftKnee, ids.leftAnkle], ["lower-body", "knee"]),
  definition("joint-angle.right-knee.internal.v1", "Right knee internal angle", "right", "knee", [ids.rightHip, ids.rightKnee, ids.rightAnkle], ["lower-body", "knee"]),
  definition("joint-angle.left-hip.internal.v1", "Left hip internal angle", "left", "hip", [ids.leftShoulder, ids.leftHip, ids.leftKnee], ["lower-body", "hip"]),
  definition("joint-angle.right-hip.internal.v1", "Right hip internal angle", "right", "hip", [ids.rightShoulder, ids.rightHip, ids.rightKnee], ["lower-body", "hip"]),
  definition("joint-angle.left-ankle.internal.v1", "Left ankle internal angle", "left", "ankle", [ids.leftKnee, ids.leftAnkle, ids.leftFootIndex], ["lower-body", "ankle"]),
  definition("joint-angle.right-ankle.internal.v1", "Right ankle internal angle", "right", "ankle", [ids.rightKnee, ids.rightAnkle, ids.rightFootIndex], ["lower-body", "ankle"]),
  definition("joint-angle.left-elbow.internal.v1", "Left elbow internal angle", "left", "elbow", [ids.leftShoulder, ids.leftElbow, ids.leftWrist], ["upper-body", "elbow"]),
  definition("joint-angle.right-elbow.internal.v1", "Right elbow internal angle", "right", "elbow", [ids.rightShoulder, ids.rightElbow, ids.rightWrist], ["upper-body", "elbow"]),
  definition("joint-angle.left-shoulder.internal.v1", "Left shoulder internal angle", "left", "shoulder", [ids.leftElbow, ids.leftShoulder, ids.leftHip], ["upper-body", "shoulder"]),
  definition("joint-angle.right-shoulder.internal.v1", "Right shoulder internal angle", "right", "shoulder", [ids.rightElbow, ids.rightShoulder, ids.rightHip], ["upper-body", "shoulder"]),
] as const;

export function validateJointAngleRegistry(definitions: readonly JointAngleDefinition[]): void {
  const seen = new Set<string>();
  for (const item of definitions) {
    if (seen.has(item.metricId)) throw new Error(`Duplicate joint-angle metric ID: ${item.metricId}`);
    seen.add(item.metricId);
    if (item.contractVersion !== JOINT_ANGLE_CONTRACT_VERSION) throw new Error(`Unsupported contract version: ${item.contractVersion}`);
    if (!item.metricId.match(/^joint-angle\.(left|right|center)-[a-z-]+\.internal\.v\d+$/)) throw new Error(`Invalid metric ID: ${item.metricId}`);
    if (!["left", "right", "center"].includes(item.side)) throw new Error(`Invalid side: ${item.side}`);
    if (item.landmarks.length !== 3 || new Set(item.landmarks).size !== 3) throw new Error(`Metric ${item.metricId} requires three distinct landmarks`);
    if (item.vertexLandmarkId !== item.landmarks[1]) throw new Error(`Metric ${item.metricId} vertex must be triplet B`);
    if (item.landmarks.some((id) => !Number.isInteger(id) || id < 0 || id >= MEDIAPIPE_POSE_LANDMARK_COUNT)) throw new Error(`Metric ${item.metricId} has an invalid landmark ID`);
    if (item.unit !== "degrees") throw new Error(`Metric ${item.metricId} must use degrees`);
    if (![item.resultRange.minimum, item.resultRange.maximum].every(Number.isFinite) || item.resultRange.minimum >= item.resultRange.maximum) throw new Error(`Metric ${item.metricId} has an invalid result range`);
    const policy = item.coordinatePolicy;
    if (!policy.realtimeAllowed.includes(policy.preferred) || !policy.formalAllowed.includes(policy.preferred)) throw new Error(`Metric ${item.metricId} omits its preferred coordinate space`);
    if (policy.normalized2DFallback !== "not-permitted" && (policy.preferred as string) === "normalized-2d") throw new Error(`Metric ${item.metricId} fallback equals preferred space`);
    if (policy.mixingSpacesWithinResult !== false || policy.spacesBiomechanicallyEquivalent !== false) throw new Error(`Metric ${item.metricId} has an invalid coordinate-space policy`);
    if (item.realtimeInput.source !== "filtered-runtime-pose") throw new Error(`Metric ${item.metricId} must declare its realtime input`);
    if (item.formalInput.source.includes("filtered-runtime-pose")) throw new Error(`Metric ${item.metricId} formal policy cannot consume FilteredRuntimePose`);
    if (item.unavailableValue !== null) throw new Error(`Metric ${item.metricId} unavailable value must be null`);
    if (!Number.isFinite(item.confidence.minimum) || item.confidence.minimum < 0 || item.confidence.minimum > 1) throw new Error(`Metric ${item.metricId} has invalid confidence policy`);
    if (item.deprecated && !item.replacementMetricId) throw new Error(`Deprecated metric ${item.metricId} requires a replacement`);
  }
}

validateJointAngleRegistry(builtInDefinitions);
export const JOINT_ANGLE_REGISTRY: readonly JointAngleDefinition[] = Object.freeze([...builtInDefinitions]);
const registryById = new Map(JOINT_ANGLE_REGISTRY.map((item) => [item.metricId, item]));

export function getJointAngleDefinition(metricId: JointAngleMetricId): JointAngleDefinition | null {
  return registryById.get(metricId) ?? null;
}

export function listJointAngleDefinitions(): readonly JointAngleDefinition[] {
  return JOINT_ANGLE_REGISTRY;
}

export function listJointAnglesBySide(side: JointAngleSide): readonly JointAngleDefinition[] {
  return Object.freeze(JOINT_ANGLE_REGISTRY.filter((item) => item.side === side));
}

export function listJointAnglesByJoint(joint: JointAngleJoint): readonly JointAngleDefinition[] {
  return Object.freeze(JOINT_ANGLE_REGISTRY.filter((item) => item.joint === joint));
}

export function resolveRequiredLandmarkIds(metricId: JointAngleMetricId): readonly [number, number, number] | null {
  return getJointAngleDefinition(metricId)?.landmarks ?? null;
}

export function supportsRealtimeCoordinateSpace(metricId: JointAngleMetricId, space: JointAngleCoordinateSpace): boolean {
  return getJointAngleDefinition(metricId)?.coordinatePolicy.realtimeAllowed.includes(space) ?? false;
}

export function supportsFormalCoordinateSpace(metricId: JointAngleMetricId, space: JointAngleCoordinateSpace): boolean {
  return getJointAngleDefinition(metricId)?.coordinatePolicy.formalAllowed.includes(space) ?? false;
}
