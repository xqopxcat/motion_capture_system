import type { PoseEngine } from "./PoseEngine";
import {
  createMediaPipePoseEngineFromConfig,
  LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG,
} from "./mediaPipeRuntimeConfig";
import { createNoopPoseEngine } from "./noopPoseEngine";

export type PoseEngineKind = "default" | "noop";

export function createPoseEngine(kind: PoseEngineKind = "default"): PoseEngine {
  if (kind === "default") {
    return createMediaPipePoseEngineFromConfig(LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG);
  }

  if (kind === "noop") {
    return createNoopPoseEngine();
  }

  return createMediaPipePoseEngineFromConfig(LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG);
}
