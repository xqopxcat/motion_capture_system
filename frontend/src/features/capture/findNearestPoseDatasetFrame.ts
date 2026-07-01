import type { CapturePoseDatasetDraftFrame } from "./buildPoseDatasetDraft";

export const RECORDED_POSE_FRAME_MATCH_THRESHOLD_MS = 100;

export function findNearestPoseDatasetFrame(
  frames: CapturePoseDatasetDraftFrame[],
  timestampMs: number,
  thresholdMs = RECORDED_POSE_FRAME_MATCH_THRESHOLD_MS,
): CapturePoseDatasetDraftFrame | null {
  let nearestFrame: CapturePoseDatasetDraftFrame | null = null;
  let nearestDistanceMs = Number.POSITIVE_INFINITY;

  frames.forEach((frame) => {
    const distanceMs = Math.abs(frame.timestampMs - timestampMs);

    if (distanceMs < nearestDistanceMs) {
      nearestFrame = frame;
      nearestDistanceMs = distanceMs;
    }
  });

  return nearestDistanceMs <= thresholdMs ? nearestFrame : null;
}
