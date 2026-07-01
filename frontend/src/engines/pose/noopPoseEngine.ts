import type { PoseEngine } from "./PoseEngine";
import type { PoseDetectionInput, PoseDetectionResult, PoseEngineMetadata } from "./types";

const noopPoseEngineMetadata: PoseEngineMetadata = {
  name: "noop-pose-engine",
  version: "0.0.0",
  capabilities: {
    supports2D: true,
    supports3D: false,
    supportsRealtime: false,
    supportsVideoFrame: true,
    supportsVisibility: false,
    jointCount: 33,
    outputSchema: "pose.v1",
  },
};

export function createNoopPoseEngine(): PoseEngine {
  return {
    metadata: noopPoseEngineMetadata,
    async initialize() {
      return Promise.resolve();
    },
    async detect(input: PoseDetectionInput): Promise<PoseDetectionResult> {
      return {
        engineName: noopPoseEngineMetadata.name,
        engineVersion: noopPoseEngineMetadata.version,
        timestampMs: input.timestampMs,
        landmarks: [],
      };
    },
    dispose() {
      return undefined;
    },
  };
}
