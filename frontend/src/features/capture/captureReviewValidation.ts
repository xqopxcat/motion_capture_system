import type { CaptureReviewSnapshot } from "./captureControllerTypes";

export const MINIMUM_REVIEW_DURATION_MS = 500;

export type CaptureReviewCandidate = Omit<CaptureReviewSnapshot, "reviewToken"> & {
  reviewToken: CaptureReviewSnapshot["reviewToken"];
};

export function validateCaptureReviewCandidate(candidate: CaptureReviewCandidate) {
  const errors: string[] = [];
  if (candidate.videoBlob.size === 0) errors.push("video-empty");
  if (!Number.isFinite(candidate.durationMs) || candidate.durationMs < MINIMUM_REVIEW_DURATION_MS) {
    errors.push("duration-too-short");
  }
  if (candidate.poseDraft.metadata.frameCount < 1) errors.push("pose-empty");
  if (candidate.poseDraft.metadata.durationMs < 0) errors.push("pose-timing-invalid");
  if (!candidate.videoUrl) errors.push("review-url-missing");
  return { valid: errors.length === 0, errors };
}

