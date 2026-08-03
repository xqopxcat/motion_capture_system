import { MEDIAPIPE_POSE_LANDMARK_COUNT } from "./mediaPipePoseLandmarks";
import type { PoseDetectionResult, PoseLandmark2D, PoseLandmark3D, RawCanonicalPose } from "./types";

export type RawCanonicalPoseSourceIdentity = Readonly<{
  sourceTimestampMs: number;
  frameIndex?: number;
  cameraSessionId?: number;
}>;

function validateIdentity(value: number | undefined, name: string) {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
    throw new Error(`Raw Canonical Pose ${name} must be a non-negative integer when present.`);
  }
}

function validateLandmarks(
  landmarks: readonly (PoseLandmark2D | PoseLandmark3D)[],
  collection: "2D" | "3D",
) {
  if (landmarks.length !== 0 && landmarks.length !== MEDIAPIPE_POSE_LANDMARK_COUNT) {
    throw new Error(`Raw Canonical Pose ${collection} landmarks must be empty or contain exactly 33 landmarks.`);
  }
  landmarks.forEach((landmark, index) => {
    if (landmark.id !== index) throw new Error(`Raw Canonical Pose ${collection} landmark identity is invalid.`);
    const coordinates = "z" in landmark
      ? [landmark.x, landmark.y, landmark.z]
      : [landmark.x, landmark.y];
    if (!coordinates.every(Number.isFinite)) {
      throw new Error(`Raw Canonical Pose ${collection} coordinates must be finite.`);
    }
    if (landmark.visibility !== undefined && !Number.isFinite(landmark.visibility)) {
      throw new Error(`Raw Canonical Pose ${collection} visibility must be finite when present.`);
    }
  });
}

export function mapPoseDetectionResultToRawCanonicalPose(
  result: PoseDetectionResult,
  source: RawCanonicalPoseSourceIdentity,
): RawCanonicalPose {
  if (!Number.isFinite(source.sourceTimestampMs) || source.sourceTimestampMs < 0) {
    throw new Error("Raw Canonical Pose source timestamp must be finite and non-negative.");
  }
  validateIdentity(source.frameIndex, "frame index");
  validateIdentity(source.cameraSessionId, "camera session identity");
  validateLandmarks(result.landmarks2D, "2D");
  validateLandmarks(result.landmarks3D, "3D");

  const canonicalPose = {
    engineName: result.engineName,
    engineVersion: result.engineVersion,
    timestampMs: source.sourceTimestampMs,
    ...(source.frameIndex === undefined ? {} : { frameIndex: source.frameIndex }),
    ...(source.cameraSessionId === undefined ? {} : { cameraSessionId: source.cameraSessionId }),
    landmarks2D: result.landmarks2D.map((landmark) => ({ ...landmark })),
    landmarks3D: result.landmarks3D.map((landmark) => ({ ...landmark })),
  };
  return canonicalPose as unknown as RawCanonicalPose;
}
