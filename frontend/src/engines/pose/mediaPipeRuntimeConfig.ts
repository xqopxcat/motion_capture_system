import { createMediaPipePoseEngine } from "./MediaPipePoseEngine";
import type { MediaPipePoseEngineOptions } from "./MediaPipePoseEngine";

export type MediaPipeRuntimeAssetConfig = Required<MediaPipePoseEngineOptions>;

export const LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG: MediaPipeRuntimeAssetConfig = {
  // CDN paths are centralized here so they can be replaced by Vite public asset paths later.
  modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
  wasmBasePath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
};

export function createMediaPipePoseEngineFromConfig(config: MediaPipeRuntimeAssetConfig) {
  return createMediaPipePoseEngine(config);
}
