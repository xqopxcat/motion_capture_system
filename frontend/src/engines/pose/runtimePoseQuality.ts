import { POSE_DATA_AUTHORITY } from "../poseQuality";
import { MEDIAPIPE_POSE_LANDMARK_COUNT } from "./mediaPipePoseLandmarks";
import { OneEuroScalarFilter } from "./oneEuroFilter";
import { STABILIZED_RUNTIME_POSE_PROFILE, validateRuntimePoseStabilizationProfile, type RuntimePoseStabilizationProfile } from "./stabilizationProfile";
import type { FilteredRuntimePose, PoseLandmark2D, PoseLandmark3D, RawCanonicalPose } from "./types";

export type RuntimePoseResetReason = "session-change" | "camera-flip" | "restart" | "stop" | "dispose" | "inference-error" | "timestamp-regression" | "excessive-gap" | "retake" | "explicit";
type LandmarkStateName = FilteredRuntimePose["landmarkQuality"][number]["state"];
type CollectionName = "2d" | "3d";

type LandmarkFilterState = {
  filters: { x: OneEuroScalarFilter; y: OneEuroScalarFilter; z?: OneEuroScalarFilter };
  lastAcceptedInput: { x: number; y: number; z?: number; timestampMs: number };
  lastOutput: PoseLandmark2D | PoseLandmark3D;
  missingCount: number;
  outlierCount: number;
};

type NumericSummary = Readonly<{ count: number; mean: number | null; max: number | null }>;
export type RuntimePoseQualityDiagnostics = Readonly<{
  rawInputCount: number;
  stabilizedOutputCount: number;
  landmarksFiltered: number;
  lowConfidenceSamples: number;
  temporaryHolds: number;
  unavailableLandmarks: number;
  rejectedOutliers: number;
  timestampGaps: number;
  resets: Readonly<Record<RuntimePoseResetReason, number>>;
  processingDurationMs: NumericSummary;
  rawFilteredDisplacement2D: NumericSummary;
  retainedLandmarkStateCount: number;
}>;

const RESET_REASONS: readonly RuntimePoseResetReason[] = ["session-change", "camera-flip", "restart", "stop", "dispose", "inference-error", "timestamp-regression", "excessive-gap", "retake", "explicit"];

function summary(values: readonly number[]): NumericSummary {
  return values.length === 0 ? { count: 0, mean: null, max: null } : {
    count: values.length,
    mean: values.reduce((total, value) => total + value, 0) / values.length,
    max: Math.max(...values),
  };
}

function pushBounded(values: number[], value: number, capacity = 300) {
  if (!Number.isFinite(value)) return;
  if (values.length === capacity) values.shift();
  values.push(value);
}

function isUsableLandmark(landmark: Readonly<PoseLandmark2D | PoseLandmark3D> | undefined, id: number, minimumVisibility: number) {
  if (!landmark || landmark.id !== id) return false;
  const coordinates = "z" in landmark ? [landmark.x, landmark.y, landmark.z] : [landmark.x, landmark.y];
  return coordinates.every(Number.isFinite) && (landmark.visibility === undefined || (Number.isFinite(landmark.visibility) && landmark.visibility >= minimumVisibility));
}

export class RuntimePoseQualityEngine {
  private states = new Map<string, LandmarkFilterState>();
  private cameraSessionId: number | undefined;
  private lastTimestampMs: number | null = null;
  private disposed = false;
  private rawInputCount = 0;
  private stabilizedOutputCount = 0;
  private landmarksFiltered = 0;
  private lowConfidenceSamples = 0;
  private temporaryHolds = 0;
  private unavailableLandmarks = 0;
  private rejectedOutliers = 0;
  private timestampGaps = 0;
  private resetCounts = Object.fromEntries(RESET_REASONS.map((reason) => [reason, 0])) as Record<RuntimePoseResetReason, number>;
  private processingDurations: number[] = [];
  private displacements2D: number[] = [];

  constructor(readonly profile: RuntimePoseStabilizationProfile = STABILIZED_RUNTIME_POSE_PROFILE) {
    validateRuntimePoseStabilizationProfile(profile);
  }

  private createState(landmark: Readonly<PoseLandmark2D | PoseLandmark3D>, timestampMs: number): LandmarkFilterState {
    const filters = {
      x: new OneEuroScalarFilter(this.profile.oneEuro),
      y: new OneEuroScalarFilter(this.profile.oneEuro),
      ...("z" in landmark ? { z: new OneEuroScalarFilter(this.profile.oneEuro) } : {}),
    };
    const output = { ...landmark };
    filters.x.filter(landmark.x, timestampMs);
    filters.y.filter(landmark.y, timestampMs);
    if ("z" in landmark) filters.z?.filter(landmark.z, timestampMs);
    return { filters, lastAcceptedInput: { x: landmark.x, y: landmark.y, ...("z" in landmark ? { z: landmark.z } : {}), timestampMs }, lastOutput: output, missingCount: 0, outlierCount: 0 };
  }

  private processLandmark(collection: CollectionName, landmark: Readonly<PoseLandmark2D | PoseLandmark3D> | undefined, id: number, timestampMs: number) {
    const key = `${collection}:${id}`;
    let state = this.states.get(key);
    const usable = isUsableLandmark(landmark, id, this.profile.minimumVisibility);
    if (!usable) {
      if (landmark?.visibility !== undefined && Number.isFinite(landmark.visibility) && landmark.visibility < this.profile.minimumVisibility) this.lowConfidenceSamples += 1;
      if (state) {
        state.missingCount += 1;
        const ageMs = timestampMs - state.lastAcceptedInput.timestampMs;
        if (ageMs <= this.profile.missingHoldDurationMs && state.missingCount <= this.profile.maximumConsecutiveMissingSamples) {
          this.temporaryHolds += 1;
          return { landmark: { ...state.lastOutput }, state: "held" as LandmarkStateName, sourceTimestampMs: state.lastAcceptedInput.timestampMs };
        }
        this.states.delete(key);
      }
      this.unavailableLandmarks += 1;
      return { landmark: null, state: "unavailable" as LandmarkStateName, sourceTimestampMs: timestampMs };
    }
    const validLandmark = landmark!;
    if (!state) {
      state = this.createState(validLandmark, timestampMs);
      this.states.set(key, state);
      this.landmarksFiltered += 1;
      return { landmark: { ...state.lastOutput }, state: "filtered" as LandmarkStateName, sourceTimestampMs: timestampMs };
    }

    const elapsedSeconds = (timestampMs - state.lastAcceptedInput.timestampMs) / 1000;
    const dz = "z" in validLandmark ? validLandmark.z - (state.lastAcceptedInput.z ?? validLandmark.z) : 0;
    const distance = Math.hypot(validLandmark.x - state.lastAcceptedInput.x, validLandmark.y - state.lastAcceptedInput.y, dz);
    const maximumVelocity = collection === "2d" ? this.profile.maximumVelocity2DPerSecond : this.profile.maximumVelocity3DMetresPerSecond;
    const outlier = elapsedSeconds > 0 && distance / elapsedSeconds > maximumVelocity;
    if (outlier) {
      state.outlierCount += 1;
      if (state.outlierCount <= this.profile.maximumConsecutiveOutliers) {
        this.rejectedOutliers += 1;
        return { landmark: { ...state.lastOutput }, state: "outlier-rejected" as LandmarkStateName, sourceTimestampMs: state.lastAcceptedInput.timestampMs };
      }
      state = this.createState(validLandmark, timestampMs);
      this.states.set(key, state);
      this.landmarksFiltered += 1;
      return { landmark: { ...state.lastOutput }, state: "filtered" as LandmarkStateName, sourceTimestampMs: timestampMs };
    }

    const filtered = {
      ...validLandmark,
      x: state.filters.x.filter(validLandmark.x, timestampMs),
      y: state.filters.y.filter(validLandmark.y, timestampMs),
      ...("z" in validLandmark ? { z: state.filters.z!.filter(validLandmark.z, timestampMs) } : {}),
    };
    state.lastAcceptedInput = { x: validLandmark.x, y: validLandmark.y, ...("z" in validLandmark ? { z: validLandmark.z } : {}), timestampMs };
    state.lastOutput = filtered;
    state.missingCount = 0;
    state.outlierCount = 0;
    this.landmarksFiltered += 1;
    return { landmark: filtered, state: "filtered" as LandmarkStateName, sourceTimestampMs: timestampMs };
  }

  transform(rawPose: RawCanonicalPose | null): FilteredRuntimePose | null {
    if (this.disposed) throw new Error("Runtime Pose quality engine is disposed.");
    if (!rawPose || rawPose.landmarks2D.length === 0) return null;
    if (rawPose.landmarks2D.length !== MEDIAPIPE_POSE_LANDMARK_COUNT || (rawPose.landmarks3D.length !== 0 && rawPose.landmarks3D.length !== MEDIAPIPE_POSE_LANDMARK_COUNT)) throw new Error("Runtime Pose quality input must preserve the 33-landmark topology.");
    if (!Number.isFinite(rawPose.timestampMs) || rawPose.timestampMs < 0) throw new Error("Runtime Pose quality input requires a finite source timestamp.");
    [...rawPose.landmarks2D, ...rawPose.landmarks3D].forEach((landmark) => {
      const values = "z" in landmark ? [landmark.x, landmark.y, landmark.z] : [landmark.x, landmark.y];
      if (!values.every(Number.isFinite)) throw new Error("Runtime Pose quality coordinates must be finite.");
    });

    const startedAt = typeof performance === "undefined" ? 0 : performance.now();
    this.rawInputCount += 1;
    if (this.cameraSessionId !== undefined && rawPose.cameraSessionId !== this.cameraSessionId) this.reset("session-change");
    if (this.lastTimestampMs !== null && rawPose.timestampMs < this.lastTimestampMs) this.reset("timestamp-regression");
    else if (this.lastTimestampMs !== null && rawPose.timestampMs - this.lastTimestampMs > this.profile.maximumTimeGapMs) {
      this.timestampGaps += 1;
      this.reset("excessive-gap");
    }
    this.cameraSessionId = rawPose.cameraSessionId;
    this.lastTimestampMs = rawPose.timestampMs;

    const quality: Array<{ id: number; state: LandmarkStateName; sourceTimestampMs: number }> = [];
    const quality3D: Array<{ id: number; state: LandmarkStateName; sourceTimestampMs: number }> = [];
    const landmarks2D: Array<PoseLandmark2D | null> = [];
    const landmarks3D: Array<PoseLandmark3D | null> = [];
    let frameFiltered = 0, frameHeld = 0, frameOutliers = 0, frameUnavailable = 0;
    for (let id = 0; id < MEDIAPIPE_POSE_LANDMARK_COUNT; id += 1) {
      const two = this.processLandmark("2d", rawPose.landmarks2D[id], id, rawPose.timestampMs);
      if (two.landmark) {
        landmarks2D.push(two.landmark as PoseLandmark2D);
        const raw = rawPose.landmarks2D[id];
        pushBounded(this.displacements2D, Math.hypot(two.landmark.x - raw.x, two.landmark.y - raw.y));
      } else landmarks2D.push(null);
      quality.push({ id, state: two.state, sourceTimestampMs: two.sourceTimestampMs });
      if (two.state === "filtered") frameFiltered += 1;
      else if (two.state === "held") frameHeld += 1;
      else if (two.state === "outlier-rejected") frameOutliers += 1;
      else frameUnavailable += 1;
      if (rawPose.landmarks3D.length > 0) {
        const three = this.processLandmark("3d", rawPose.landmarks3D[id], id, rawPose.timestampMs);
        landmarks3D.push(three.landmark ? three.landmark as PoseLandmark3D : null);
        quality3D.push({ id, state: three.state, sourceTimestampMs: three.sourceTimestampMs });
      }
    }
    this.stabilizedOutputCount += 1;
    const endedAt = typeof performance === "undefined" ? startedAt : performance.now();
    pushBounded(this.processingDurations, endedAt - startedAt);
    return {
      engineName: rawPose.engineName, engineVersion: rawPose.engineVersion, timestampMs: rawPose.timestampMs,
      ...(rawPose.frameIndex === undefined ? {} : { frameIndex: rawPose.frameIndex }),
      ...(rawPose.cameraSessionId === undefined ? {} : { cameraSessionId: rawPose.cameraSessionId }),
      runtimeProfileId: this.profile.id,
      landmarks2D, landmarks3D, landmarkQuality: quality, landmarkQuality3D: quality3D,
      qualityDiagnostics: { filtered: frameFiltered, held: frameHeld, outliers: frameOutliers, unavailable: frameUnavailable },
    } as unknown as FilteredRuntimePose;
  }

  reset(reason: RuntimePoseResetReason = "explicit") {
    this.states.clear();
    this.cameraSessionId = undefined;
    this.lastTimestampMs = null;
    this.resetCounts[reason] += 1;
  }

  dispose() {
    if (this.disposed) return;
    this.reset("dispose");
    this.disposed = true;
  }

  snapshotDiagnostics(): RuntimePoseQualityDiagnostics {
    return { rawInputCount: this.rawInputCount, stabilizedOutputCount: this.stabilizedOutputCount, landmarksFiltered: this.landmarksFiltered, lowConfidenceSamples: this.lowConfidenceSamples, temporaryHolds: this.temporaryHolds, unavailableLandmarks: this.unavailableLandmarks, rejectedOutliers: this.rejectedOutliers, timestampGaps: this.timestampGaps, resets: { ...this.resetCounts }, processingDurationMs: summary(this.processingDurations), rawFilteredDisplacement2D: summary(this.displacements2D), retainedLandmarkStateCount: this.states.size };
  }
}

export function createRuntimePoseQualityEngine(
  profile: RuntimePoseStabilizationProfile = STABILIZED_RUNTIME_POSE_PROFILE,
) {
  return new RuntimePoseQualityEngine(profile);
}

export const RUNTIME_POSE_AUTHORITY = Object.freeze({ authoritative: POSE_DATA_AUTHORITY.filteredRuntimePose.authoritative, runtimeOnly: POSE_DATA_AUTHORITY.filteredRuntimePose.runtimeOnly, persist: POSE_DATA_AUTHORITY.filteredRuntimePose.persist });
