import { createMediaPipePoseEngine } from "./MediaPipePoseEngine";
import type { MediaPipePoseEngineOptions } from "./MediaPipePoseEngine";

export type MediaPipeRuntimeAssetConfig = Required<MediaPipePoseEngineOptions>;

export const LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG: MediaPipeRuntimeAssetConfig = {
  // Vite serves files in public/ from the site root. For local development, place:
  // - public/models/pose_landmarker.task
  // - public/mediapipe/wasm/*
  modelAssetPath: "/models/pose_landmarker.task",
  wasmBasePath: "/mediapipe/wasm",
};

export function createMediaPipePoseEngineFromConfig(config: MediaPipeRuntimeAssetConfig) {
  return createMediaPipePoseEngine(config);
}
