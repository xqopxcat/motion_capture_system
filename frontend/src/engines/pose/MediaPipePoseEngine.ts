import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseEngine } from "./PoseEngine";
import { MEDIAPIPE_POSE_LANDMARK_COUNT } from "./mediaPipePoseLandmarks";
import { normalizeMediaPipePoseResult } from "./normalizeMediaPipePoseResult";
import type { PoseDetectionInput, PoseDetectionResult, PoseEngineMetadata } from "./types";

export type MediaPipePoseEngineOptions = {
  modelAssetPath: string;
  wasmBasePath?: string;
};

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
      const normalizedResult = normalizeMediaPipePoseResult(result);

      return {
        engineName: mediaPipePoseEngineMetadata.name,
        engineVersion: mediaPipePoseEngineMetadata.version,
        timestampMs: input.timestampMs,
        frameIndex: input.frameIndex,
        ...normalizedResult,
      };
    },
    dispose() {
      poseLandmarker?.close();
      poseLandmarker = null;
    },
  };
}
