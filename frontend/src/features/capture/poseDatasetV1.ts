import type { PoseLandmark2D, PoseLandmark3D } from "../../engines/pose";
import {
  MEDIAPIPE_POSE_LANDMARK_COUNT,
  MEDIAPIPE_POSE_LANDMARK_NAMES,
  getMediaPipePoseLandmarkName,
} from "../../engines/pose/mediaPipePoseLandmarks";
import type {
  PoseDataset,
  PoseDatasetLandmark,
  PoseDatasetValidationResult,
} from "../../types";
import type { CapturePoseDatasetDraft } from "./buildPoseDatasetDraft";

const DEFAULT_POSE_ENGINE = "MediaPipe Pose Landmarker";
const DEFAULT_POSE_ENGINE_VERSION = "0.10.x";
const DEFAULT_FPS = 30;
const MS_PER_SECOND = 1000;

export type BuildPoseDatasetV1Options = {
  fps?: number;
  generatedAt?: string;
  poseEngine?: string;
  poseEngineVersion?: string;
};

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function normalizeVisibility(visibility: number | undefined) {
  return visibility ?? 1;
}

function getLandmarkZ(landmark: PoseLandmark2D | PoseLandmark3D) {
  return "z" in landmark ? landmark.z : 0;
}

function hasText(value: string) {
  return value.trim().length > 0;
}

function buildPoseDatasetLandmark(
  landmark: PoseLandmark2D | PoseLandmark3D,
): PoseDatasetLandmark {
  return {
    id: landmark.id,
    name: getMediaPipePoseLandmarkName(landmark.id),
    x: landmark.x,
    y: landmark.y,
    z: getLandmarkZ(landmark),
    visibility: normalizeVisibility(landmark.visibility),
  };
}

export function buildPoseDatasetV1(
  draft: CapturePoseDatasetDraft,
  options: BuildPoseDatasetV1Options = {},
): PoseDataset {
  const fps = options.fps ?? DEFAULT_FPS;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const poseEngine = hasText(options.poseEngine ?? "")
    ? options.poseEngine ?? DEFAULT_POSE_ENGINE
    : DEFAULT_POSE_ENGINE;
  const poseEngineVersion = hasText(options.poseEngineVersion ?? "")
    ? options.poseEngineVersion ?? DEFAULT_POSE_ENGINE_VERSION
    : DEFAULT_POSE_ENGINE_VERSION;

  const frames = draft.frames.map((frame) => ({
    frameIndex: frame.frameIndex,
    timestamp: frame.timestampMs / MS_PER_SECOND,
    landmarks2D: frame.landmarks2D.map(buildPoseDatasetLandmark),
    landmarks3D: frame.landmarks3D.map(buildPoseDatasetLandmark),
  }));

  return {
    version: "1.0",
    poseEngine,
    poseEngineVersion,
    fps,
    frameCount: frames.length,
    duration: draft.metadata.durationMs / MS_PER_SECOND,
    generatedAt,
    frames,
  };
}

function validateLandmark(
  landmark: PoseDatasetLandmark,
  expectedIndex: number,
  frameIndex: number,
  collectionName: "landmarks2D" | "landmarks3D",
  errors: string[],
) {
  const expectedName = MEDIAPIPE_POSE_LANDMARK_NAMES[expectedIndex];
  const path = `frames[${frameIndex}].${collectionName}[${expectedIndex}]`;

  if (landmark.id !== expectedIndex) {
    errors.push(`${path}.id must be ${expectedIndex}.`);
  }

  if (landmark.id < 0 || landmark.id >= MEDIAPIPE_POSE_LANDMARK_COUNT) {
    errors.push(`${path}.id must be between 0 and ${MEDIAPIPE_POSE_LANDMARK_COUNT - 1}.`);
  }

  if (landmark.name !== expectedName) {
    errors.push(`${path}.name must be ${expectedName}.`);
  }

  if (!isFiniteNumber(landmark.x)) {
    errors.push(`${path}.x must be a finite number.`);
  }

  if (!isFiniteNumber(landmark.y)) {
    errors.push(`${path}.y must be a finite number.`);
  }

  if (!isFiniteNumber(landmark.z)) {
    errors.push(`${path}.z must be a finite number.`);
  }

  if (!isFiniteNumber(landmark.visibility) || landmark.visibility < 0 || landmark.visibility > 1) {
    errors.push(`${path}.visibility must be a finite number between 0 and 1.`);
  }
}

function validateLandmarkCollection(
  landmarks: PoseDatasetLandmark[],
  frameIndex: number,
  collectionName: "landmarks2D" | "landmarks3D",
  errors: string[],
) {
  if (landmarks.length !== MEDIAPIPE_POSE_LANDMARK_COUNT) {
    errors.push(
      `frames[${frameIndex}].${collectionName} must contain exactly ${MEDIAPIPE_POSE_LANDMARK_COUNT} landmarks.`,
    );
  }

  landmarks.forEach((landmark, landmarkIndex) => {
    validateLandmark(landmark, landmarkIndex, frameIndex, collectionName, errors);
  });
}

export function validatePoseDatasetV1(dataset: PoseDataset): PoseDatasetValidationResult {
  const errors: string[] = [];
  const seenFrameIndexes = new Set<number>();
  let previousTimestamp = Number.NEGATIVE_INFINITY;

  if (!hasText(dataset.version)) {
    errors.push("version must not be empty.");
  }

  if (!hasText(dataset.poseEngine)) {
    errors.push("poseEngine must not be empty.");
  }

  if (!hasText(dataset.poseEngineVersion)) {
    errors.push("poseEngineVersion must not be empty.");
  }

  if (!isFiniteNumber(dataset.fps) || dataset.fps <= 0) {
    errors.push("fps must be greater than 0.");
  }

  if (!Number.isInteger(dataset.frameCount) || dataset.frameCount < 1) {
    errors.push("frameCount must be an integer greater than or equal to 1.");
  }

  if (!isFiniteNumber(dataset.duration) || dataset.duration < 0) {
    errors.push("duration must be greater than or equal to 0.");
  }

  if (dataset.frames.length !== dataset.frameCount) {
    errors.push("frames.length must equal frameCount.");
  }

  dataset.frames.forEach((frame, index) => {
    if (seenFrameIndexes.has(frame.frameIndex)) {
      errors.push(`frames[${index}].frameIndex must be unique.`);
    }

    seenFrameIndexes.add(frame.frameIndex);

    if (frame.frameIndex !== index) {
      errors.push(`frames[${index}].frameIndex should be sequential from 0.`);
    }

    if (!isFiniteNumber(frame.timestamp)) {
      errors.push(`frames[${index}].timestamp must be a finite number.`);
    }

    if (frame.timestamp < previousTimestamp) {
      errors.push(`frames[${index}].timestamp must be non-decreasing.`);
    }

    previousTimestamp = frame.timestamp;

    validateLandmarkCollection(frame.landmarks2D, index, "landmarks2D", errors);
    validateLandmarkCollection(frame.landmarks3D, index, "landmarks3D", errors);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
