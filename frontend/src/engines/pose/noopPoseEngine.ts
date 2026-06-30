import type { PoseEngine } from "./PoseEngine";
import type { PoseDetectionInput, PoseDetectionResult } from "./types";

const noopPoseEngineMetadata = {
  name: "noop-pose-engine",
  version: "0.0.0",
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
