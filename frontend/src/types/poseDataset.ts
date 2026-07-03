export type PoseDatasetLandmark = {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type PoseDatasetFrame = {
  frameIndex: number;
  timestamp: number;
  landmarks2D: PoseDatasetLandmark[];
  landmarks3D: PoseDatasetLandmark[];
};

export type PoseDataset = {
  version: string;
  poseEngine: string;
  poseEngineVersion: string;
  fps: number;
  frameCount: number;
  duration: number;
  generatedAt: string;
  frames: PoseDatasetFrame[];
};

export type PoseDatasetValidationResult = {
  valid: boolean;
  errors: string[];
};
