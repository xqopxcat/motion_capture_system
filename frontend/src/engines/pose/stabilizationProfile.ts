import { DEFAULT_SPRINT_7_QUALITY_POLICY } from "../poseQuality";
import type { OneEuroFilterParameters } from "./oneEuroFilter";

export type RuntimePoseStabilizationProfile = Readonly<{
  id: "runtime-visualization.stabilized.v1";
  algorithm: "one-euro.v1";
  minimumVisibility: number;
  confidencePolicy: "bounded-hold";
  oneEuro: OneEuroFilterParameters;
  maximumVelocity2DPerSecond: number;
  maximumVelocity3DMetresPerSecond: number;
  maximumConsecutiveOutliers: number;
  missingHoldDurationMs: number;
  maximumConsecutiveMissingSamples: number;
  maximumTimeGapMs: number;
  filter2D: true;
  filter3D: true;
  fallback: "hold-then-unavailable";
}>;

export const STABILIZED_RUNTIME_POSE_PROFILE = Object.freeze({
  id: "runtime-visualization.stabilized.v1",
  algorithm: "one-euro.v1",
  minimumVisibility: DEFAULT_SPRINT_7_QUALITY_POLICY.visibilityThreshold,
  confidencePolicy: "bounded-hold",
  // Task 84 physical evidence showed 7.4 FPS input and visibly delayed motion.
  // Preserve low-speed smoothing while responding much faster to movement.
  oneEuro: Object.freeze({ minCutoffHz: 2, beta: 0.3, derivativeCutoffHz: 1 }),
  maximumVelocity2DPerSecond: 8,
  maximumVelocity3DMetresPerSecond: 12,
  maximumConsecutiveOutliers: 2,
  missingHoldDurationMs: 120,
  maximumConsecutiveMissingSamples: 3,
  maximumTimeGapMs: 250,
  filter2D: true,
  filter3D: true,
  fallback: "hold-then-unavailable",
} satisfies RuntimePoseStabilizationProfile);

export function validateRuntimePoseStabilizationProfile(profile: RuntimePoseStabilizationProfile) {
  const positive = [profile.minimumVisibility, profile.oneEuro.minCutoffHz, profile.oneEuro.derivativeCutoffHz, profile.maximumVelocity2DPerSecond, profile.maximumVelocity3DMetresPerSecond, profile.missingHoldDurationMs, profile.maximumTimeGapMs];
  if (!positive.every((value) => Number.isFinite(value) && value > 0)) throw new Error("Stabilization profile positive parameters must be finite.");
  if (!Number.isFinite(profile.oneEuro.beta) || profile.oneEuro.beta < 0) throw new Error("Stabilization profile beta must be finite and non-negative.");
  if (!Number.isInteger(profile.maximumConsecutiveOutliers) || profile.maximumConsecutiveOutliers < 0 || !Number.isInteger(profile.maximumConsecutiveMissingSamples) || profile.maximumConsecutiveMissingSamples < 0) throw new Error("Stabilization profile sample limits must be non-negative integers.");
  return profile;
}
