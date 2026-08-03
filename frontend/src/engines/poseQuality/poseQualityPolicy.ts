import { PRODUCTION_SKELETON_PROFILE } from "../visualization/productionSkeletonProfile";

export type QualityMetricId = "jitter-2d" | "inference-latency" | "publication-latency" | "pose-age" | "stale-timeout" | "low-confidence-ratio" | "unavailable-frame-ratio" | "sync-error" | "publication-rate" | "resource-growth";
export type QualityClassification = "pass" | "warning" | "fail" | "unavailable";
export type QualityTarget = Readonly<{ id: QualityMetricId; name: string; definition: string; unit: string; aggregation: string; direction: "lower" | "higher"; passBoundary: number; failBoundary: number; scenarios: readonly string[]; platforms: readonly ("desktop" | "mobile" | "all")[]; evidence: string; status: "confirmed-existing-contract" | "initial-engineering-target" | "requires-physical-validation" }>;
export type LandmarkQualityState = "available" | "low-confidence" | "missing" | "unavailable";
export type PoseFrameQualityState = "available" | "partial" | "degraded" | "stale" | "unavailable";
export type RuntimeQualityProfileId = "runtime-visualization.identity.v1";

function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(freeze);
  }
  return value;
}

const physical = ["desktop", "mobile"] as const;
function assertBoundaryOrder(value: Pick<QualityTarget, "direction" | "passBoundary" | "failBoundary">, label: string) {
  if (!Number.isFinite(value.passBoundary) || !Number.isFinite(value.failBoundary)) {
    throw new Error(`Quality target ${label} boundaries must be finite.`);
  }
  const ordered = value.direction === "lower"
    ? value.passBoundary <= value.failBoundary
    : value.passBoundary >= value.failBoundary;
  if (!ordered) throw new Error(`Quality target ${label} boundaries are out of order.`);
}

export function validateQualityTarget(value: QualityTarget) {
  assertBoundaryOrder(value, value.id);
  return value;
}

const target = (value: QualityTarget) => validateQualityTarget(value);
export const POSE_QUALITY_TARGETS: readonly QualityTarget[] = freeze([
  target({ id: "jitter-2d", name: "Stationary landmark jitter", definition: "P95 of per-landmark RMS radial displacement from the landmark median in a static sequence", unit: "normalized-coordinate", aggregation: "per-landmark RMS; sequence P95", direction: "lower", passBoundary: .012, failBoundary: .03, scenarios: ["static-full-body", "static-upper-body", "static-seated-occluded"], platforms: physical, evidence: "Task 67 method; numeric target provisional", status: "requires-physical-validation" }),
  target({ id: "inference-latency", name: "Inference latency", definition: "Inference completion minus inference start", unit: "ms", aggregation: "sequence P95", direction: "lower", passBoundary: 50, failBoundary: 120, scenarios: ["slow-squat", "fast-arm", "inference-delay"], platforms: physical, evidence: "Initial responsiveness budget", status: "requires-physical-validation" }),
  target({ id: "publication-latency", name: "Accepted publication latency", definition: "Accepted publication minus camera candidate observation", unit: "ms", aggregation: "sequence P95", direction: "lower", passBoundary: 80, failBoundary: 200, scenarios: ["slow-arm-raise", "frame-replacement"], platforms: physical, evidence: "Task 73 instrumentation; provisional", status: "requires-physical-validation" }),
  target({ id: "pose-age", name: "End-to-end Pose age", definition: "Render time minus source candidate observation time", unit: "ms", aggregation: "sequence P95", direction: "lower", passBoundary: 120, failBoundary: PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs, scenarios: ["left-right", "fast-squat"], platforms: physical, evidence: "Frame-to-overlay proxy and stale boundary", status: "requires-physical-validation" }),
  target({ id: "stale-timeout", name: "Stale Pose timeout", definition: "Maximum displayed Pose age before clear", unit: "ms", aggregation: "configured boundary", direction: "lower", passBoundary: PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs, failBoundary: PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs, scenarios: ["inference-delay", "tab-restore"], platforms: ["all"], evidence: "PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs", status: "confirmed-existing-contract" }),
  target({ id: "low-confidence-ratio", name: "Low-confidence landmark ratio", definition: "Present benchmark landmark samples below visibility threshold divided by present benchmark landmark samples", unit: "ratio", aggregation: "per-frame; sequence mean and P95", direction: "lower", passBoundary: .05, failBoundary: .3, scenarios: ["static-full-body", "static-seated-occluded", "low-light"], platforms: physical, evidence: "Existing 0.35 visibility threshold; ratio provisional", status: "requires-physical-validation" }),
  target({ id: "unavailable-frame-ratio", name: "Unavailable Pose-frame ratio", definition: "Measurement candidates without a usable Pose divided by measurement candidates; interval skips excluded", unit: "ratio", aggregation: "whole-sequence ratio", direction: "lower", passBoundary: .02, failBoundary: .1, scenarios: ["slow-knee-flexion", "temporary-occlusion"], platforms: physical, evidence: "Initial engineering target", status: "requires-physical-validation" }),
  target({ id: "sync-error", name: "Video/Pose synchronization error", definition: "Absolute current-media-time minus selected-Pose-timestamp", unit: "ms", aggregation: "sequence P95", direction: "lower", passBoundary: 34, failBoundary: 100, scenarios: ["sync-playback", "sync-pause", "sync-seek", "sync-next", "sync-previous"], platforms: physical, evidence: "Approximately one 30 FPS frame; provisional", status: "requires-physical-validation" }),
  target({ id: "publication-rate", name: "Accepted Pose publication rate", definition: "Accepted non-stale publications per visible active second", unit: "Hz", aggregation: "whole-sequence rate", direction: "higher", passBoundary: 20, failBoundary: 10, scenarios: ["left-right", "fast-arm"], platforms: physical, evidence: "Initial engineering target", status: "requires-physical-validation" }),
  target({ id: "resource-growth", name: "Long-session resource growth", definition: "Retained runtime resource growth from stabilized baseline after 30 minutes", unit: "percent", aggregation: "end-minus-baseline plus leak count", direction: "lower", passBoundary: 5, failBoundary: 20, scenarios: ["long-session"], platforms: physical, evidence: "Initial leak-detection budget", status: "requires-physical-validation" }),
]);

export const POSE_DATA_AUTHORITY = freeze({
  rawCanonicalPose: { authoritative: true, immutableAfterPublication: true, landmarkCount: 33, recordingInput: true },
  filteredRuntimePose: { authoritative: false, runtimeOnly: true, persist: false, implemented: false, preservesSourceIdentity: true },
  persistedArtifact: { schemaVersion: "pose.v1", source: "raw-canonical-pose", filteredCoordinates: false, jointAngles: false, metricSeries: false },
} as const);

export const POSE_CONSUMER_POLICIES = freeze([
  ["Live Capture Skeleton", "filtered-runtime-pose", "runtime-visualization", "identity-until-task-77", false],
  ["Live Capture future Angle Overlay", "filtered-runtime-pose", "runtime-visualization", "identity-until-task-77", false],
  ["Countdown", "raw-canonical-pose", "control", "none", false],
  ["Recording collection", "raw-canonical-pose", "recording", "none", true],
  ["Capture Review", "persisted-raw-pose", "runtime-visualization", "visualization-quality-profile", false],
  ["Viewer", "persisted-raw-pose", "runtime-visualization", "visualization-quality-profile", false],
  ["Compare", "persisted-raw-pose", "runtime-visualization", "visualization-quality-profile", false],
  ["pose.v1 serializer", "raw-canonical-pose", "recording", "none", true],
  ["Metric Series", "raw-canonical-pose", "formal-analysis", "versioned-analysis-policy", true],
  ["Metric Summary", "raw-canonical-pose", "formal-analysis", "versioned-analysis-policy", true],
  ["Debug", "filtered-runtime-pose", "diagnostic", "labelled-raw-filtered-comparison", false],
] as const);

export const BENCHMARK_SCENARIOS = freeze([
  ["static-full-body", "static", "30 s", "fixed camera; full body still", "automated+physical"], ["static-upper-body", "static", "30 s", "head through hips still", "manual+physical"], ["static-seated-occluded", "static", "30 s", "seated with natural occlusion", "manual+physical"],
  ["slow-squat", "controlled", "30 s", "five metronome squats", "manual+physical"], ["slow-arm-raise", "controlled", "30 s", "five bilateral raises", "manual+physical"], ["slow-knee-flexion", "controlled", "40 s", "five flexions per side", "manual+physical"], ["left-right", "controlled", "30 s", "repeated lateral shift", "manual+physical"],
  ["fast-arm", "fast", "20 s", "rapid arm motion with blur", "manual+physical"], ["fast-squat", "fast", "20 s", "five fast transitions", "manual+physical"],
  ["temporary-occlusion", "degraded", "20 s", "hide and restore wrist/knee", "manual+physical"], ["partial-out-of-frame", "degraded", "20 s", "move body partly outside frame", "manual+physical"], ["low-light", "degraded", "30 s", "documented low illumination", "manual+physical"], ["camera-flip", "degraded", "3 cycles", "change camera session", "manual+physical"], ["rotation", "degraded", "3 cycles", "portrait/landscape rotation", "manual+physical"], ["tab-restore", "degraded", "3 cycles", "hide 5 s then restore", "automated+physical"], ["inference-delay", "degraded", "300 candidates", "deterministic delayed inference", "automated+synthetic"], ["frame-replacement", "degraded", "300 candidates", "candidates exceed inference rate", "automated+synthetic"], ["long-session", "degraded", "30 min", "continuous Capture", "manual+physical"],
  ["sync-playback", "sync", "60 s", "timestamped Capture Review fixture", "automated+manual"], ["sync-pause", "sync", "20 operations", "pause fixture", "automated+manual"], ["sync-seek", "sync", "20 operations", "timeline seek fixture", "automated+manual"], ["sync-next", "sync", "20 operations", "next-frame fixture", "automated+manual"], ["sync-previous", "sync", "20 operations", "previous-frame fixture", "automated+manual"],
] as const);

export const DEFAULT_SPRINT_7_QUALITY_POLICY = freeze({ id: "sprint-7-quality.v1", visibilityThreshold: PRODUCTION_SKELETON_PROFILE.minimumVisibilityThreshold, maximumPoseAgeMs: PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs, benchmarkLandmarkIds: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28], runtimeProfileId: "runtime-visualization.identity.v1" as RuntimeQualityProfileId, targets: POSE_QUALITY_TARGETS, authority: POSE_DATA_AUTHORITY, consumers: POSE_CONSUMER_POLICIES, scenarios: BENCHMARK_SCENARIOS });

export function classifyQuality(target: Pick<QualityTarget, "direction" | "passBoundary" | "failBoundary">, value: number): QualityClassification {
  assertBoundaryOrder(target, "classification");
  if (!Number.isFinite(value)) return "unavailable";
  if (target.direction === "lower") {
    if (value <= target.passBoundary) return "pass";
    return value < target.failBoundary ? "warning" : "fail";
  }
  if (value >= target.passBoundary) return "pass";
  return value > target.failBoundary ? "warning" : "fail";
}
