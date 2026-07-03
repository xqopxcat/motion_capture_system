import {
  MEDIAPIPE_POSE_LANDMARK_COUNT,
  getMediaPipePoseLandmarkName,
} from "../../engines/pose/mediaPipePoseLandmarks";
import type { PoseDataset, PoseDatasetFrame, PoseDatasetLandmark } from "../../types";

const LOCAL_DEMO_VIDEO_SRC = "local-exported-video-placeholder.webm";

function createLandmark(index: number): PoseDatasetLandmark {
  return {
    id: index,
    name: getMediaPipePoseLandmarkName(index),
    x: 0.25 + index * 0.01,
    y: 0.2 + index * 0.005,
    z: 0,
    visibility: 0.95,
  };
}

function createFrame(frameIndex: number, timestamp: number): PoseDatasetFrame {
  const landmarks = Array.from({ length: MEDIAPIPE_POSE_LANDMARK_COUNT }, (_, index) =>
    createLandmark(index),
  );

  return {
    frameIndex,
    timestamp,
    landmarks2D: landmarks.map((landmark) => ({ ...landmark })),
    landmarks3D: landmarks.map((landmark) => ({ ...landmark })),
  };
}

export const LOCAL_VIEWER_ARTIFACT_FIXTURE: PoseDataset = {
  version: "1.0",
  poseEngine: "MediaPipe Pose Landmarker",
  poseEngineVersion: "0.10.x",
  fps: 30,
  frameCount: 2,
  duration: 0.033,
  generatedAt: "2026-07-04T00:00:00.000Z",
  frames: [createFrame(0, 0), createFrame(1, 0.033)],
};

export const LOCAL_VIEWER_VIDEO_SRC = LOCAL_DEMO_VIDEO_SRC;
