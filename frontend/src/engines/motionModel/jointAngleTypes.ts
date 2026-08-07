export const JOINT_ANGLE_CONTRACT_VERSION = "joint-angle-contract.v1" as const;

export type JointAngleContractVersion = typeof JOINT_ANGLE_CONTRACT_VERSION;
export type JointAngleSide = "left" | "right" | "center";
export type JointAngleJoint = "knee" | "hip" | "ankle" | "elbow" | "shoulder" | "wrist";
export type JointAngleCoordinateSpace = "world-3d" | "normalized-2d";
export type JointAngleMetricId =
  | "joint-angle.left-knee.internal.v1"
  | "joint-angle.right-knee.internal.v1"
  | "joint-angle.left-hip.internal.v1"
  | "joint-angle.right-hip.internal.v1"
  | "joint-angle.left-ankle.internal.v1"
  | "joint-angle.right-ankle.internal.v1"
  | "joint-angle.left-elbow.internal.v1"
  | "joint-angle.right-elbow.internal.v1"
  | "joint-angle.left-shoulder.internal.v1"
  | "joint-angle.right-shoulder.internal.v1"
  | "joint-angle.left-wrist.internal.v1"
  | "joint-angle.right-wrist.internal.v1";

export type JointAngleAvailabilityReason =
  | "missing-landmark"
  | "low-confidence"
  | "unavailable-runtime-landmark"
  | "held-runtime-landmark"
  | "outlier-rejected-runtime-landmark"
  | "zero-length-vector"
  | "nonfinite-coordinate"
  | "unsupported-coordinate-space"
  | "malformed-topology"
  | "stale-pose";

export type JointAngleDefinition = Readonly<{
  metricId: JointAngleMetricId;
  contractVersion: JointAngleContractVersion;
  displayLabel: string;
  side: JointAngleSide;
  joint: JointAngleJoint;
  landmarks: readonly [number, number, number];
  vertexLandmarkId: number;
  unit: "degrees";
  resultRange: Readonly<{ minimum: 0; maximum: 180 }>;
  geometricConvention: "unsigned-internal-angle";
  coordinatePolicy: Readonly<{
    preferred: "world-3d";
    realtimeAllowed: readonly JointAngleCoordinateSpace[];
    formalAllowed: readonly JointAngleCoordinateSpace[];
    normalized2DFallback: "realtime-display-only" | "not-permitted";
    spacesBiomechanicallyEquivalent: false;
    mixingSpacesWithinResult: false;
  }>;
  realtimeInput: Readonly<{
    source: "filtered-runtime-pose";
    authoritative: false;
    filtered: "usable";
    held: "degraded";
    outlierRejected: "degraded";
    unavailable: "unavailable";
  }>;
  formalInput: Readonly<{
    source: "raw-canonical-pose-or-persisted-pose.v1";
    preprocessing: "approved-versioned-analysis-profile";
    runtimeHoldSemantics: false;
    authoritative: true;
  }>;
  confidence: Readonly<{
    aggregation: "minimum-required-landmark-confidence";
    minimum: number;
  }>;
  unavailableValue: null;
  tags: readonly string[];
  deprecated: boolean;
  replacementMetricId?: JointAngleMetricId;
}>;

type JointAngleResultBase = Readonly<{
  metricId: JointAngleMetricId;
  contractVersion: JointAngleContractVersion;
  sourceTimestampMs: number;
  frameIndex?: number;
  cameraSessionId?: number;
  inputLandmarkIds: readonly [number, number, number];
  confidence: number | null;
}>;

type AvailableAngleMeasurement = Readonly<{
  status: "available";
  reason?: never;
  valueDegrees: number;
  coordinateSpace: JointAngleCoordinateSpace;
}>;

type DegradedAngleMeasurement = Readonly<{
  status: "degraded";
  reason: "low-confidence" | "held-runtime-landmark" | "outlier-rejected-runtime-landmark";
  valueDegrees: number;
  coordinateSpace: JointAngleCoordinateSpace;
}>;

type UnavailableAngleMeasurement = Readonly<{
  status: "unavailable";
  reason: JointAngleAvailabilityReason;
  valueDegrees: null;
  coordinateSpace: JointAngleCoordinateSpace | null;
}>;

export type RuntimeJointAngleResult = JointAngleResultBase &
  (AvailableAngleMeasurement | DegradedAngleMeasurement | UnavailableAngleMeasurement) &
  Readonly<{
    provenance: "runtime-display";
    runtimeProfileId: string;
    analysisProfileId?: never;
    analysisProfileVersion?: never;
  }>;

export type FormalJointAngleResult = JointAngleResultBase &
  (AvailableAngleMeasurement | UnavailableAngleMeasurement) &
  Readonly<{
    provenance: "formal-analysis";
    analysisProfileId: string;
    analysisProfileVersion: string;
    runtimeProfileId?: never;
  }>;

export type JointAngleResult = RuntimeJointAngleResult | FormalJointAngleResult;
