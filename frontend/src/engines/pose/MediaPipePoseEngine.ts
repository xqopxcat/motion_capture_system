import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { PoseEngine } from "./PoseEngine";
import type {
  PoseDetectionInput,
  PoseDetectionResult,
  PoseEngineMetadata,
  PoseLandmark,
} from "./types";

export type MediaPipePoseEngineOptions = {
  modelAssetPath: string;
  wasmBasePath?: string;
};

const MEDIAPIPE_POSE_LANDMARK_COUNT = 33;

const mediaPipePoseEngineMetadata: PoseEngineMetadata = {
  name: "mediapipe-pose-landmarker",
  version: "0.10.35",
  capabilities: {
    supports2D: true,
    supports3D: true,
    supportsRealtime: true,
    supportsVideoFrame: true,
    supportsVisibility: true,
    jointCount: MEDIAPIPE_POSE_LANDMARK_COUNT,
    outputSchema: "pose.v1",
  },
};

function mapMediaPipeLandmark(landmark: NormalizedLandmark, index: number): PoseLandmark {
  return {
    jointId: `mediapipe.pose.${index}`,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility,
  };
}

export function createMediaPipePoseEngine({
  modelAssetPath,
  wasmBasePath,
}: MediaPipePoseEngineOptions): PoseEngine {
  let poseLandmarker: PoseLandmarker | null = null;

  return {
    metadata: mediaPipePoseEngineMetadata,
    async initialize() {
      const visionFileset = await FilesetResolver.forVisionTasks(wasmBasePath);
      poseLandmarker = await PoseLandmarker.createFromOptions(visionFileset, {
        baseOptions: {
          modelAssetPath,
        },
        runningMode: "VIDEO",
        numPoses: 1,
        outputSegmentationMasks: false,
      });
    },
    async detect(input: PoseDetectionInput): Promise<PoseDetectionResult> {
      if (!poseLandmarker) {
        throw new Error("MediaPipe pose engine must be initialized before detection.");
      }

      const result = poseLandmarker.detectForVideo(input.source, input.timestampMs);
      const landmarks = result.landmarks[0]?.map(mapMediaPipeLandmark) ?? [];

      return {
        engineName: mediaPipePoseEngineMetadata.name,
        engineVersion: mediaPipePoseEngineMetadata.version,
        timestampMs: input.timestampMs,
        landmarks,
      };
    },
    dispose() {
      poseLandmarker?.close();
      poseLandmarker = null;
    },
  };
}
