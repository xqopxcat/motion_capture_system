import { STABILIZED_RUNTIME_POSE_PROFILE } from "../../engines/pose/stabilizationProfile";

type SharedProfileContract = Readonly<{
  version: `${number}.${number}.${number}`;
  inputSchema: "pose.v1/raw-canonical-pose";
  confidence: Readonly<{ minimumVisibility: number }>;
  outlierPolicy: "task-77-velocity-gate" | "none";
  missingDataPolicy: "bounded-hold-then-unavailable" | "unavailable";
  world3DPolicy: "preferred-with-realtime-2d-fallback" | "required";
  timestampSemantics: "source-frame-monotonic";
  deterministic: true;
  provenanceRequired: true;
}>;

export type RealtimeDisplayProfile = SharedProfileContract & Readonly<{
  kind: "realtime-display";
  id: "candidate.realtime-display.task77.v1";
  purpose: "bounded-latency-live-visualization";
  authority: "non-authoritative";
  causal: true;
  usesFutureFrames: false;
  smoothing: Readonly<{ method: "one-euro.v1" }>;
  hold: Readonly<{ policy: "bounded"; maximumDurationMs: number; maximumSamples: number }>;
  interpolation: "none";
  warmup: "first-observation";
  reset: "camera-session-or-gap";
  output: "filtered-runtime-pose";
  metricCompatibility: "runtime-display";
  persistenceEligible: false;
}>;

export type FinalAnalysisProfile = SharedProfileContract & (
  | Readonly<{ kind: "final-analysis"; id: "candidate.final.raw-frame-local.v1"; purpose: "reproducible-formal-evidence"; authority: "derived-from-authoritative-raw"; causal: true; usesFutureFrames: false; strategy: "raw-frame-local"; smoothing: "none"; hold: "none"; interpolation: "none"; warmup: "none"; reset: "camera-session"; output: "formal-angle-series"; metricCompatibility: "formal-analysis"; persistenceEligible: true }>
  | Readonly<{ kind: "final-analysis"; id: "candidate.final.causal-replay.v1"; purpose: "candidate-sequence-analysis"; authority: "derived-from-authoritative-raw"; causal: true; usesFutureFrames: false; strategy: "causal-replay"; smoothing: Readonly<{ method: "coordinate-ema"; alpha: number }>; hold: "none"; interpolation: "none"; warmup: "first-observation"; reset: "camera-session"; output: "candidate-formal-angle-series"; metricCompatibility: "experimental-formal"; persistenceEligible: false }>
  | Readonly<{ kind: "final-analysis"; id: "candidate.final.centered-average.v1"; purpose: "candidate-sequence-analysis"; authority: "derived-from-authoritative-raw"; causal: false; usesFutureFrames: true; strategy: "non-causal-centered-average"; smoothing: Readonly<{ method: "centered-coordinate-average"; radiusFrames: 1 }>; hold: "none"; interpolation: "none"; warmup: "truncate-window-at-edge"; reset: "camera-session"; output: "candidate-formal-angle-series"; metricCompatibility: "experimental-formal"; persistenceEligible: false }>
);

const shared = Object.freeze({ inputSchema: "pose.v1/raw-canonical-pose", confidence: Object.freeze({ minimumVisibility: STABILIZED_RUNTIME_POSE_PROFILE.minimumVisibility }), missingDataPolicy: "unavailable", world3DPolicy: "required", timestampSemantics: "source-frame-monotonic", deterministic: true, provenanceRequired: true } as const);

export const REALTIME_DISPLAY_CANDIDATE: RealtimeDisplayProfile = Object.freeze({ ...shared, kind: "realtime-display", id: "candidate.realtime-display.task77.v1", version: "1.0.0", purpose: "bounded-latency-live-visualization", authority: "non-authoritative", causal: true, usesFutureFrames: false, smoothing: Object.freeze({ method: "one-euro.v1" }), outlierPolicy: "task-77-velocity-gate", missingDataPolicy: "bounded-hold-then-unavailable", world3DPolicy: "preferred-with-realtime-2d-fallback", hold: Object.freeze({ policy: "bounded", maximumDurationMs: STABILIZED_RUNTIME_POSE_PROFILE.missingHoldDurationMs, maximumSamples: STABILIZED_RUNTIME_POSE_PROFILE.maximumConsecutiveMissingSamples }), interpolation: "none", warmup: "first-observation", reset: "camera-session-or-gap", output: "filtered-runtime-pose", metricCompatibility: "runtime-display", persistenceEligible: false });
export const RAW_FRAME_LOCAL_FINAL_CANDIDATE: FinalAnalysisProfile = Object.freeze({ ...shared, kind: "final-analysis", id: "candidate.final.raw-frame-local.v1", version: "1.0.0", purpose: "reproducible-formal-evidence", authority: "derived-from-authoritative-raw", causal: true, usesFutureFrames: false, strategy: "raw-frame-local", smoothing: "none", outlierPolicy: "none", hold: "none", interpolation: "none", warmup: "none", reset: "camera-session", output: "formal-angle-series", metricCompatibility: "formal-analysis", persistenceEligible: true });
export const CAUSAL_REPLAY_FINAL_CANDIDATE: FinalAnalysisProfile = Object.freeze({ ...shared, kind: "final-analysis", id: "candidate.final.causal-replay.v1", version: "1.0.0", purpose: "candidate-sequence-analysis", authority: "derived-from-authoritative-raw", causal: true, usesFutureFrames: false, strategy: "causal-replay", smoothing: Object.freeze({ method: "coordinate-ema", alpha: 0.5 }), outlierPolicy: "none", hold: "none", interpolation: "none", warmup: "first-observation", reset: "camera-session", output: "candidate-formal-angle-series", metricCompatibility: "experimental-formal", persistenceEligible: false });
export const NON_CAUSAL_FINAL_CANDIDATE: FinalAnalysisProfile = Object.freeze({ ...shared, kind: "final-analysis", id: "candidate.final.centered-average.v1", version: "1.0.0", purpose: "candidate-sequence-analysis", authority: "derived-from-authoritative-raw", causal: false, usesFutureFrames: true, strategy: "non-causal-centered-average", smoothing: Object.freeze({ method: "centered-coordinate-average", radiusFrames: 1 }), outlierPolicy: "none", hold: "none", interpolation: "none", warmup: "truncate-window-at-edge", reset: "camera-session", output: "candidate-formal-angle-series", metricCompatibility: "experimental-formal", persistenceEligible: false });

export function validateCandidateProfile(profile: RealtimeDisplayProfile | FinalAnalysisProfile) {
  if (profile.kind === "realtime-display" && (!profile.causal || profile.usesFutureFrames || profile.persistenceEligible)) throw new Error("Realtime profile contract is contradictory");
  if (profile.kind === "final-analysis" && profile.strategy === "non-causal-centered-average" && (!profile.usesFutureFrames || profile.causal)) throw new Error("Non-causal final profile must explicitly use future frames");
  return profile;
}
