import type { PoseLandmark2D, PoseLandmark3D } from "./types";
import { getMediaPipePoseLandmarkName } from "./mediaPipePoseLandmarks";

export type MediaPipeNormalizedLandmarkLike = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type MediaPipeWorldLandmarkLike = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type MediaPipePoseResultLike = {
  landmarks: MediaPipeNormalizedLandmarkLike[][];
  worldLandmarks?: MediaPipeWorldLandmarkLike[][];
};

export function normalizeMediaPipeLandmarks2D(
  landmarks: readonly MediaPipeNormalizedLandmarkLike[] = [],
): PoseLandmark2D[] {
  return landmarks.map((landmark, index) => ({
    id: index,
    name: getMediaPipePoseLandmarkName(index),
    x: landmark.x,
    y: landmark.y,
    visibility: landmark.visibility,
  }));
}

export function normalizeMediaPipeLandmarks3D(
  landmarks: readonly MediaPipeWorldLandmarkLike[] = [],
): PoseLandmark3D[] {
  return landmarks.map((landmark, index) => ({
    id: index,
    name: getMediaPipePoseLandmarkName(index),
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility,
  }));
}

export function normalizeMediaPipePoseResult(result: MediaPipePoseResultLike) {
  return {
    landmarks2D: normalizeMediaPipeLandmarks2D(result.landmarks[0] ?? []),
    landmarks3D: normalizeMediaPipeLandmarks3D(result.worldLandmarks?.[0] ?? []),
  };
}
