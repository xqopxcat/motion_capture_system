import { DEFAULT_SPRINT_7_QUALITY_POLICY, POSE_DATA_AUTHORITY } from "../poseQuality";
import { MEDIAPIPE_POSE_LANDMARK_COUNT } from "./mediaPipePoseLandmarks";
import type { FilteredRuntimePose, RawCanonicalPose } from "./types";

export const IDENTITY_RUNTIME_POSE_PROFILE_ID = DEFAULT_SPRINT_7_QUALITY_POLICY.runtimeProfileId;

export function transformRawPoseForRuntimeVisualization(
  rawPose: RawCanonicalPose | null,
): FilteredRuntimePose | null {
  if (!rawPose || rawPose.landmarks2D.length === 0) return null;
  if (rawPose.landmarks2D.length !== MEDIAPIPE_POSE_LANDMARK_COUNT) {
    throw new Error("Runtime Pose quality input must contain exactly 33 2D landmarks.");
  }
  if (
    rawPose.landmarks3D.length !== 0 &&
    rawPose.landmarks3D.length !== MEDIAPIPE_POSE_LANDMARK_COUNT
  ) {
    throw new Error("Runtime Pose quality input must contain zero or exactly 33 world landmarks.");
  }
  if (!Number.isFinite(rawPose.timestampMs) || rawPose.timestampMs < 0) {
    throw new Error("Runtime Pose quality input requires a finite source timestamp.");
  }

  const filteredPose = {
    engineName: rawPose.engineName,
    engineVersion: rawPose.engineVersion,
    timestampMs: rawPose.timestampMs,
    ...(rawPose.frameIndex === undefined ? {} : { frameIndex: rawPose.frameIndex }),
    ...(rawPose.cameraSessionId === undefined ? {} : { cameraSessionId: rawPose.cameraSessionId }),
    runtimeProfileId: IDENTITY_RUNTIME_POSE_PROFILE_ID,
    landmarks2D: rawPose.landmarks2D.map((landmark) => ({ ...landmark })),
    landmarks3D: rawPose.landmarks3D.map((landmark) => ({ ...landmark })),
  };
  return filteredPose as unknown as FilteredRuntimePose;
}

export const RUNTIME_POSE_AUTHORITY = Object.freeze({
  authoritative: POSE_DATA_AUTHORITY.filteredRuntimePose.authoritative,
  runtimeOnly: POSE_DATA_AUTHORITY.filteredRuntimePose.runtimeOnly,
  persist: POSE_DATA_AUTHORITY.filteredRuntimePose.persist,
});
