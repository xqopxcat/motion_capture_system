import { describe, expect, it } from "vitest";
import {
  MEDIAPIPE_POSE_LANDMARK_COUNT,
  getMediaPipePoseLandmarkName,
} from "../../engines/pose/mediaPipePoseLandmarks";
import type { PoseDataset } from "../../types";
import type { CapturePoseDatasetDraft } from "./buildPoseDatasetDraft";
import { buildPoseDatasetV1, validatePoseDatasetV1 } from "./poseDatasetV1";

function createDraftFrame(frameIndex: number, timestampMs: number) {
  return {
    frameIndex,
    timestampMs,
    landmarks2D: Array.from({ length: MEDIAPIPE_POSE_LANDMARK_COUNT }, (_, index) => ({
      id: index,
      name: getMediaPipePoseLandmarkName(index),
      x: index / 100,
      y: index / 100 + 0.1,
      visibility: 0.9,
    })),
    landmarks3D: Array.from({ length: MEDIAPIPE_POSE_LANDMARK_COUNT }, (_, index) => ({
      id: index,
      name: getMediaPipePoseLandmarkName(index),
      x: index / 100,
      y: index / 100 + 0.1,
      z: index / 100 + 0.2,
      visibility: 0.8,
    })),
  };
}

function createDraft(): CapturePoseDatasetDraft {
  return {
    schemaVersion: "pose.v1",
    source: {
      type: "capture",
    },
    metadata: {
      frameCount: 2,
      durationMs: 66,
      jointCount: MEDIAPIPE_POSE_LANDMARK_COUNT,
      has2D: true,
      has3D: true,
    },
    frames: [createDraftFrame(0, 0), createDraftFrame(1, 66)],
  };
}

function createValidPoseDataset(): PoseDataset {
  return buildPoseDatasetV1(createDraft(), {
    fps: 30,
    generatedAt: "2026-07-04T00:00:00.000Z",
    poseEngine: "MediaPipe Pose Landmarker",
    poseEngineVersion: "0.10.35",
  });
}

function expectInvalidDataset(dataset: PoseDataset, expectedMessage: string) {
  const result = validatePoseDatasetV1(dataset);

  expect(result.valid).toBe(false);
  expect(result.errors.some((error) => error.includes(expectedMessage))).toBe(true);
}

describe("poseDatasetV1", () => {
  it("converts a capture draft into a valid pose.v1-compatible PoseDataset", () => {
    const dataset = createValidPoseDataset();
    const result = validatePoseDatasetV1(dataset);

    expect(dataset).toMatchObject({
      version: "1.0",
      poseEngine: "MediaPipe Pose Landmarker",
      poseEngineVersion: "0.10.35",
      fps: 30,
      frameCount: 2,
      duration: 0.066,
      generatedAt: "2026-07-04T00:00:00.000Z",
    });
    expect(dataset.frames[1].timestamp).toBe(0.066);
    expect(dataset.frames[0].landmarks2D).toHaveLength(MEDIAPIPE_POSE_LANDMARK_COUNT);
    expect(dataset.frames[0].landmarks3D).toHaveLength(MEDIAPIPE_POSE_LANDMARK_COUNT);
    expect(dataset.frames[0].landmarks2D[0]).toEqual({
      id: 0,
      name: "nose",
      x: 0,
      y: 0.1,
      z: 0,
      visibility: 0.9,
    });
    expect(result).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("fails validation when frames are missing", () => {
    const dataset = createValidPoseDataset();
    dataset.frames = [];

    expectInvalidDataset(dataset, "frames.length must equal frameCount");
  });

  it("fails validation when fps is invalid", () => {
    const dataset = createValidPoseDataset();
    dataset.fps = 0;

    expectInvalidDataset(dataset, "fps must be greater than 0");
  });

  it("fails validation when landmark count is wrong", () => {
    const dataset = createValidPoseDataset();
    dataset.frames[0].landmarks2D = dataset.frames[0].landmarks2D.slice(0, -1);

    expectInvalidDataset(dataset, "landmarks2D must contain exactly 33 landmarks");
  });

  it("fails validation when landmark id is invalid", () => {
    const dataset = createValidPoseDataset();
    dataset.frames[0].landmarks3D[5].id = 99;

    expectInvalidDataset(dataset, "landmarks3D[5].id must be 5");
    expectInvalidDataset(dataset, "landmarks3D[5].id must be between 0 and 32");
  });

  it("fails validation when visibility is outside 0 to 1", () => {
    const dataset = createValidPoseDataset();
    dataset.frames[0].landmarks2D[0].visibility = 1.5;

    expectInvalidDataset(dataset, "visibility must be a finite number between 0 and 1");
  });

  it("fails validation when coordinates are not finite", () => {
    const dataset = createValidPoseDataset();
    dataset.frames[0].landmarks3D[0].z = Number.NaN;

    expectInvalidDataset(dataset, "z must be a finite number");
  });

  it("fails validation when timestamps move backward", () => {
    const dataset = createValidPoseDataset();
    dataset.frames[1].timestamp = dataset.frames[0].timestamp - 1;

    expectInvalidDataset(dataset, "timestamp must be non-decreasing");
  });
});
