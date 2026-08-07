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

/**
 * Resolves the authoritative recorded Pose that is active at a playback time.
 * Recorded inference cadence may be much lower than video refresh cadence, so
 * an already-published frame remains active until the next frame timestamp.
 */
export function findActivePoseDatasetFrame(
  frames: CapturePoseDatasetDraftFrame[],
  timestampMs: number,
): CapturePoseDatasetDraftFrame | null {
  if (frames.length === 0 || !Number.isFinite(timestampMs)) return null;
  let active: CapturePoseDatasetDraftFrame | null = null;
  for (const frame of frames) {
    if (frame.timestampMs > timestampMs) break;
    active = frame;
  }
  return active;
}
