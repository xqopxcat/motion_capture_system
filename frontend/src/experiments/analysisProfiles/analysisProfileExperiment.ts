import { calculateSelectedFormalJointAngles, getJointAngleDefinition, type JointAngleMetricId } from "../../engines/motionModel";
import type { PoseLandmark3D, RawCanonicalPose } from "../../engines/pose";
import type { FinalAnalysisProfile } from "./candidateProfiles";

export type CandidateAngleSample = Readonly<{ frameIndex: number; cameraSessionId: number; timestampMs: number; metricId: JointAngleMetricId; valueDegrees: number | null; status: "available" | "unavailable" }>;
export type TransitionEvaluationInput = Readonly<{ metricId: JointAngleMetricId; cameraSessionId: number; transitionFrameIndex: number; targetDegrees: number; toleranceDegrees: number }>;
export type TransitionEvaluationResult = Readonly<{ evaluated: boolean; reachedTarget: boolean; lagFrames: number | null }>;
export type CandidateEvaluation = Readonly<{ profileId: string; samples: readonly CandidateAngleSample[]; validCount: number; unavailableCount: number; degradedCount: 0; meanAbsoluteError: number | null; maximumAbsoluteError: number | null; jitterStandardDeviation: number | null; transition: TransitionEvaluationResult; preprocessingDurationMs: number; metricDurationMs: number; totalDurationMs: number }>;

export function validateRawPoseSequence(frames: readonly RawCanonicalPose[]) {
  let previous: RawCanonicalPose | undefined;
  for (const frame of frames) {
    if (frame.frameIndex === undefined || frame.cameraSessionId === undefined) throw new Error("Sequence frames require frameIndex and cameraSessionId");
    if (previous) {
      if (frame.cameraSessionId === previous.cameraSessionId && (frame.frameIndex <= previous.frameIndex! || frame.timestampMs <= previous.timestampMs)) throw new Error("Duplicate or out-of-order frame identity");
      if (frame.cameraSessionId !== previous.cameraSessionId && frame.timestampMs <= previous.timestampMs) throw new Error("Session boundary timestamps must remain ordered");
    }
    previous = frame;
  }
  return frames;
}

function cloneWithWorld(frame: RawCanonicalPose, landmarks3D: readonly PoseLandmark3D[]): RawCanonicalPose {
  return { ...frame, landmarks3D: Object.freeze(landmarks3D.map((point) => Object.freeze({ ...point }))) } as RawCanonicalPose;
}

function causal(frames: readonly RawCanonicalPose[], alpha: number) {
  let previous: readonly PoseLandmark3D[] | null = null;
  let session: number | undefined;
  return frames.map((frame) => {
    if (frame.cameraSessionId !== session) { session = frame.cameraSessionId; previous = null; }
    if (frame.landmarks3D.length !== 33) { previous = null; return frame; }
    const next = frame.landmarks3D.map((point, id) => previous ? { ...point, x: alpha * point.x + (1 - alpha) * previous[id].x, y: alpha * point.y + (1 - alpha) * previous[id].y, z: alpha * point.z + (1 - alpha) * previous[id].z } : { ...point });
    previous = next;
    return cloneWithWorld(frame, next);
  });
}

function centered(frames: readonly RawCanonicalPose[]) {
  return frames.map((frame, index) => {
    if (frame.landmarks3D.length !== 33) return frame;
    const window = frames.slice(Math.max(0, index - 1), index + 2).filter((candidate) => candidate.cameraSessionId === frame.cameraSessionId && candidate.landmarks3D.length === 33);
    const next = frame.landmarks3D.map((point, id) => ({ ...point, x: window.reduce((sum, item) => sum + item.landmarks3D[id].x, 0) / window.length, y: window.reduce((sum, item) => sum + item.landmarks3D[id].y, 0) / window.length, z: window.reduce((sum, item) => sum + item.landmarks3D[id].z, 0) / window.length }));
    return cloneWithWorld(frame, next);
  });
}

function standardDeviation(values: readonly number[]) {
  if (!values.length) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

function evaluateTransition(samples: readonly CandidateAngleSample[], input?: TransitionEvaluationInput): TransitionEvaluationResult {
  if (!input) return Object.freeze({ evaluated: false, reachedTarget: false, lagFrames: null });
  if (!Number.isInteger(input.transitionFrameIndex) || !Number.isInteger(input.cameraSessionId) || !Number.isFinite(input.targetDegrees) || !Number.isFinite(input.toleranceDegrees) || input.toleranceDegrees < 0) throw new Error("Transition evaluation input is invalid");
  const reached = samples.find((sample) => sample.metricId === input.metricId && sample.cameraSessionId === input.cameraSessionId && sample.frameIndex >= input.transitionFrameIndex && sample.valueDegrees !== null && Math.abs(sample.valueDegrees - input.targetDegrees) <= input.toleranceDegrees);
  return Object.freeze(reached ? { evaluated: true, reachedTarget: true, lagFrames: reached.frameIndex - input.transitionFrameIndex } : { evaluated: true, reachedTarget: false, lagFrames: null });
}

export function evaluateFinalCandidate(profile: FinalAnalysisProfile, input: readonly RawCanonicalPose[], metricIds: readonly JointAngleMetricId[], truthDegrees?: readonly number[], transitionInput?: TransitionEvaluationInput): CandidateEvaluation {
  validateRawPoseSequence(input);
  const started = performance.now();
  const processed = profile.strategy === "causal-replay" ? causal(input, profile.smoothing.alpha) : profile.strategy === "non-causal-centered-average" ? centered(input) : [...input];
  const preprocessingDone = performance.now();
  const samples = processed.flatMap((frame) => calculateSelectedFormalJointAngles(frame, metricIds).map((result) => ({ frameIndex: frame.frameIndex!, cameraSessionId: frame.cameraSessionId!, timestampMs: frame.timestampMs, metricId: result.metricId, valueDegrees: result.valueDegrees, status: result.status })));
  const metricDone = performance.now();
  const values = samples.filter((sample): sample is CandidateAngleSample & { valueDegrees: number } => sample.valueDegrees !== null).map((sample) => sample.valueDegrees);
  const errors = truthDegrees ? samples.flatMap((sample, index) => sample.valueDegrees === null || truthDegrees[index] === undefined ? [] : [Math.abs(sample.valueDegrees - truthDegrees[index])]) : [];
  return Object.freeze({ profileId: profile.id, samples: Object.freeze(samples), validCount: values.length, unavailableCount: samples.length - values.length, degradedCount: 0, meanAbsoluteError: errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : null, maximumAbsoluteError: errors.length ? Math.max(...errors) : null, jitterStandardDeviation: standardDeviation(values), transition: evaluateTransition(samples, transitionInput), preprocessingDurationMs: preprocessingDone - started, metricDurationMs: metricDone - preprocessingDone, totalDurationMs: metricDone - started });
}

export function smoothAngleSeries(values: readonly (number | null)[]) {
  return values.map((value, index) => value === null ? null : [values[index - 1], value, values[index + 1]].filter((item): item is number => item !== null && item !== undefined).reduce((sum, item, _, list) => sum + item / list.length, 0));
}

export function metricLandmarkIds(metricId: JointAngleMetricId) { return getJointAngleDefinition(metricId)!.landmarks; }
