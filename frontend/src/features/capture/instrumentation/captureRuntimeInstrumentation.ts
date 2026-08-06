import type { RuntimeJointAngleResult } from "../../../engines/motionModel";
import type { FilteredRuntimePose, PoseLandmark2D, RawCanonicalPose, RuntimePoseQualityDiagnostics } from "../../../engines/pose";

const DEFAULT_SAMPLE_CAPACITY = 300;
const JITTER_LANDMARK_IDS = [11, 12, 23, 24, 25, 26, 27, 28] as const;
const MIN_JITTER_VISIBILITY = 0.5;
export const CAPTURE_DIAGNOSTICS_REFRESH_INTERVAL_MS = 500;

export type NumericSummary = {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  p50: number | null;
  p95: number | null;
  standardDeviation: number | null;
};

export type PoseResultMeasurement = {
  sequenceId: number;
  sourceMediaTimestampMs: number;
  sourceFrameObservedAtMs: number;
  inferenceStartedAtMs: number;
  producedAtMs: number;
};

type JitterFrame = {
  landmarks: PoseLandmark2D[];
};

type TimedWindow = {
  startMs: number;
  endMs: number;
};

export type CaptureRuntimeSnapshot = {
  enabled: boolean;
  generatedAt: string;
  sessionStartedAtMs: number;
  validation: {
    cameraSessionId: number | null;
    frameIndex: number | null;
    poseTimestampMs: number | null;
    angleCalculationDurationMs: NumericSummary;
    selectedAngles: Array<{ metricId: string; status: string; valueDegrees: number | null; coordinateSpace: string | null }>;
    renderingContext: { mirror: boolean; objectFit: "contain"; sourceWidth: number | null; sourceHeight: number | null; canvasWidth: number; canvasHeight: number; canvasCssWidth: number; canvasCssHeight: number; devicePixelRatio: number } | null;
    sessionMismatchRejectedCount: null;
  };
  camera: {
    cameraFrameCount: number;
    cameraFrameRate: number | null;
    latestCameraFrameTimestampMs: number | null;
    latestVideoReadyState: number | null;
    frameIntervalMs: NumericSummary;
  };
  inference: {
    candidateFrameCount: number;
    inferenceAttemptCount: number;
    inferenceCompletedCount: number;
    inferenceSkippedCount: number;
    inferenceFailureCount: number;
    inferenceFPS: number | null;
    latestInferenceDurationMs: number | null;
    inferenceDurationMs: NumericSummary;
    pendingInferenceCount: number;
    maximumObservedPendingInference: number;
    droppedOrSupersededFrameCount: number;
    coalescedCandidateCount: number;
    pendingFrameReplacementCount: number;
    staleResultRejectedCount: number;
    acceptedResultPublicationCount: number;
    producerPauseCount: number;
    producerResumeCount: number;
    sourceFrameToPublishLatencyMs: NumericSummary;
  };
  poseResult: {
    latestResultSequenceId: number | null;
    latestPoseResultAgeMs: number | null;
    poseResultAgeMs: NumericSummary;
    videoFrameToOverlayProxyMs: NumericSummary;
  };
  rendering: {
    canvasRenderCount: number;
    renderFPS: number | null;
    latestRenderDurationMs: number | null;
    renderDurationMs: NumericSummary;
    repeatedRenderOfSamePoseCount: number;
    skippedCanvasRenderCount: number;
  };
  react: {
    CapturePage: number;
    CaptureSkeletonOverlay: number;
    useCapturePipeline: number;
  };
  mainThread: {
    supported: boolean | null;
    longTaskCount: number;
    longTaskDurationMs: NumericSummary;
    overlapWithInferenceCount: number;
    overlapWithRenderCount: number;
  };
  jitter: {
    status: "unavailable" | "collecting" | "ready";
    selectedLandmarkIds: number[];
    excludedLowVisibilitySampleCount: number;
    frameSampleCount: number;
    aggregateNormalizedRms: number | null;
    perLandmarkNormalizedRms: Record<string, number>;
  };
  previewSync: {
    sampleCount: number;
    errorMs: NumericSummary;
    repeatedPoseFrameCount: number;
    unavailableSelectionCount: number;
  };
  runtimeQuality: RuntimePoseQualityDiagnostics | null;
};

export class BoundedSampleBuffer<T> {
  private values: T[] = [];

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error("Sample buffer capacity must be a positive integer.");
    }
  }

  push(value: T) {
    if (this.values.length === this.capacity) {
      this.values.shift();
    }
    this.values.push(value);
  }

  getValues() {
    return [...this.values];
  }

  clear() {
    this.values = [];
  }

  get size() {
    return this.values.length;
  }
}

function finiteValues(values: number[]) {
  return values.filter(Number.isFinite);
}

function percentile(sortedValues: number[], fraction: number) {
  if (sortedValues.length === 0) return null;
  const index = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

export function summarizeNumericSamples(values: number[]): NumericSummary {
  const samples = finiteValues(values);
  if (samples.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      p50: null,
      p95: null,
      standardDeviation: null,
    };
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length;
  const variance =
    samples.reduce((total, value) => total + (value - mean) ** 2, 0) / samples.length;

  return {
    count: samples.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    p50: percentile(sorted, 0.5),
    p95: samples.length >= 20 ? percentile(sorted, 0.95) : null,
    standardDeviation: Math.sqrt(variance),
  };
}

export function calculatePreviewSyncErrorMs(
  videoTimestampMs: number,
  poseTimestampMs: number | null,
) {
  if (
    !Number.isFinite(videoTimestampMs) ||
    poseTimestampMs === null ||
    !Number.isFinite(poseTimestampMs)
  ) {
    return null;
  }
  return Math.abs(videoTimestampMs - poseTimestampMs);
}

export function calculateStaticJitter(
  frames: Array<{ landmarks: PoseLandmark2D[] }>,
  selectedLandmarkIds: readonly number[] = JITTER_LANDMARK_IDS,
  minimumVisibility = MIN_JITTER_VISIBILITY,
) {
  const samplesByLandmark = new Map<number, Array<{ x: number; y: number }>>();
  let excludedLowVisibilitySampleCount = 0;

  selectedLandmarkIds.forEach((id) => samplesByLandmark.set(id, []));
  frames.forEach((frame) => {
    const byId = new Map(frame.landmarks.map((landmark) => [landmark.id, landmark]));
    selectedLandmarkIds.forEach((id) => {
      const landmark = byId.get(id);
      if (
        !landmark ||
        !Number.isFinite(landmark.x) ||
        !Number.isFinite(landmark.y) ||
        (landmark.visibility ?? 1) < minimumVisibility
      ) {
        excludedLowVisibilitySampleCount += 1;
        return;
      }
      samplesByLandmark.get(id)?.push({ x: landmark.x, y: landmark.y });
    });
  });

  const perLandmarkNormalizedRms: Record<string, number> = {};
  Object.entries(
    Object.fromEntries(
      [...samplesByLandmark].map(([id, samples]) => {
        if (samples.length < 2) return [id, null];
        const center = samples.reduce(
          (result, sample) => ({ x: result.x + sample.x, y: result.y + sample.y }),
          { x: 0, y: 0 },
        );
        center.x /= samples.length;
        center.y /= samples.length;
        const meanSquaredDistance =
          samples.reduce(
            (total, sample) =>
              total + (sample.x - center.x) ** 2 + (sample.y - center.y) ** 2,
            0,
          ) / samples.length;
        return [id, Math.sqrt(meanSquaredDistance)];
      }),
    ),
  ).forEach(([id, value]) => {
    if (typeof value === "number") perLandmarkNormalizedRms[id] = value;
  });

  const aggregateValues = Object.values(perLandmarkNormalizedRms);
  return {
    excludedLowVisibilitySampleCount,
    frameSampleCount: frames.length,
    aggregateNormalizedRms:
      aggregateValues.length > 0
        ? aggregateValues.reduce((total, value) => total + value, 0) /
          aggregateValues.length
        : null,
    perLandmarkNormalizedRms,
  };
}

export function resolveCaptureDiagnosticsEnabled(input: {
  isDevelopment: boolean;
  queryValue?: string | null;
  environmentValue?: string | null;
}) {
  if (!input.isDevelopment) return false;
  return input.queryValue === "1" || input.environmentValue === "true";
}

function detectDiagnosticsEnabled() {
  const queryValue =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("captureDiagnostics");
  return resolveCaptureDiagnosticsEnabled({
    isDevelopment: import.meta.env.DEV,
    queryValue,
    environmentValue: import.meta.env.VITE_CAPTURE_DIAGNOSTICS,
  });
}

function rateFromTimestamps(timestamps: number[]) {
  if (timestamps.length < 2) return null;
  const durationMs = timestamps[timestamps.length - 1] - timestamps[0];
  return durationMs > 0 ? ((timestamps.length - 1) * 1000) / durationMs : null;
}

function overlaps(left: TimedWindow, right: TimedWindow) {
  return left.startMs <= right.endMs && right.startMs <= left.endMs;
}

export class CaptureRuntimeInstrumentation {
  readonly enabled: boolean;
  private sessionStartedAtMs = 0;
  private cameraFrameCount = 0;
  private latestCameraFrameTimestampMs: number | null = null;
  private latestCameraFrameObservedAtMs: number | null = null;
  private latestVideoReadyState: number | null = null;
  private inferenceAttemptCount = 0;
  private candidateFrameCount = 0;
  private inferenceCompletedCount = 0;
  private inferenceSkippedCount = 0;
  private inferenceFailureCount = 0;
  private pendingInferenceCount = 0;
  private maximumObservedPendingInference = 0;
  private droppedOrSupersededFrameCount = 0;
  private coalescedCandidateCount = 0;
  private pendingFrameReplacementCount = 0;
  private staleResultRejectedCount = 0;
  private acceptedResultPublicationCount = 0;
  private producerPauseCount = 0;
  private producerResumeCount = 0;
  private lastInferredSourceTimestampMs: number | null = null;
  private latestInferenceDurationMs: number | null = null;
  private latestResultSequenceId: number | null = null;
  private latestPoseResultAgeMs: number | null = null;
  private sequenceId = 0;
  private canvasRenderCount = 0;
  private latestRenderDurationMs: number | null = null;
  private lastRenderedPoseSequenceId: number | null = null;
  private repeatedRenderOfSamePoseCount = 0;
  private skippedCanvasRenderCount = 0;
  private longTaskSupported: boolean | null = null;
  private longTaskCount = 0;
  private overlapWithInferenceCount = 0;
  private overlapWithRenderCount = 0;
  private previewRepeatedPoseFrameCount = 0;
  private previewUnavailableSelectionCount = 0;
  private lastPreviewPoseFrameIndex: number | null = null;
  private runtimeQualitySnapshot: RuntimePoseQualityDiagnostics | null = null;
  private cameraSessionId: number | null = null;
  private latestFrameIndex: number | null = null;
  private latestPoseTimestampMs: number | null = null;
  private selectedAngles: CaptureRuntimeSnapshot["validation"]["selectedAngles"] = [];
  private renderingContext: CaptureRuntimeSnapshot["validation"]["renderingContext"] = null;
  private reactRenders = {
    CapturePage: 0,
    CaptureSkeletonOverlay: 0,
    useCapturePipeline: 0,
  };
  private readonly cameraFrameTimestamps = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly cameraFrameIntervals = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly inferenceCompletionTimestamps = new BoundedSampleBuffer<number>(
    DEFAULT_SAMPLE_CAPACITY,
  );
  private readonly inferenceDurations = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly poseResultAges = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly sourceFrameToPublishLatencies = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly frameToOverlayProxy = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly renderTimestamps = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly renderDurations = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly longTaskDurations = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly jitterFrames = new BoundedSampleBuffer<JitterFrame>(DEFAULT_SAMPLE_CAPACITY);
  private readonly previewSyncErrors = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly inferenceWindows = new BoundedSampleBuffer<TimedWindow>(DEFAULT_SAMPLE_CAPACITY);
  private readonly renderWindows = new BoundedSampleBuffer<TimedWindow>(DEFAULT_SAMPLE_CAPACITY);
  private readonly angleCalculationDurations = new BoundedSampleBuffer<number>(DEFAULT_SAMPLE_CAPACITY);
  private readonly poseMetadata = new WeakMap<object, PoseResultMeasurement>();

  constructor(enabled = detectDiagnosticsEnabled()) {
    this.enabled = enabled;
    this.reset();
  }

  reset(nowMs = typeof performance === "undefined" ? 0 : performance.now()) {
    this.sessionStartedAtMs = nowMs;
    this.cameraFrameCount = 0;
    this.latestCameraFrameTimestampMs = null;
    this.latestCameraFrameObservedAtMs = null;
    this.latestVideoReadyState = null;
    this.inferenceAttemptCount = 0;
    this.candidateFrameCount = 0;
    this.inferenceCompletedCount = 0;
    this.inferenceSkippedCount = 0;
    this.inferenceFailureCount = 0;
    this.pendingInferenceCount = 0;
    this.maximumObservedPendingInference = 0;
    this.droppedOrSupersededFrameCount = 0;
    this.coalescedCandidateCount = 0;
    this.pendingFrameReplacementCount = 0;
    this.staleResultRejectedCount = 0;
    this.acceptedResultPublicationCount = 0;
    this.producerPauseCount = 0;
    this.producerResumeCount = 0;
    this.lastInferredSourceTimestampMs = null;
    this.latestInferenceDurationMs = null;
    this.latestResultSequenceId = null;
    this.latestPoseResultAgeMs = null;
    this.sequenceId = 0;
    this.canvasRenderCount = 0;
    this.latestRenderDurationMs = null;
    this.lastRenderedPoseSequenceId = null;
    this.repeatedRenderOfSamePoseCount = 0;
    this.skippedCanvasRenderCount = 0;
    this.longTaskCount = 0;
    this.overlapWithInferenceCount = 0;
    this.overlapWithRenderCount = 0;
    this.previewRepeatedPoseFrameCount = 0;
    this.previewUnavailableSelectionCount = 0;
    this.lastPreviewPoseFrameIndex = null;
    this.runtimeQualitySnapshot = null;
    this.latestFrameIndex = null;
    this.latestPoseTimestampMs = null;
    this.selectedAngles = [];
    this.renderingContext = null;
    this.reactRenders = { CapturePage: 0, CaptureSkeletonOverlay: 0, useCapturePipeline: 0 };
    [
      this.cameraFrameTimestamps,
      this.cameraFrameIntervals,
      this.inferenceCompletionTimestamps,
      this.inferenceDurations,
      this.poseResultAges,
      this.sourceFrameToPublishLatencies,
      this.frameToOverlayProxy,
      this.renderTimestamps,
      this.renderDurations,
      this.longTaskDurations,
      this.jitterFrames,
      this.previewSyncErrors,
      this.inferenceWindows,
      this.renderWindows,
      this.angleCalculationDurations,
    ].forEach((buffer) => buffer.clear());
  }

  rotateCameraSession(cameraSessionId: number, nowMs = typeof performance === "undefined" ? 0 : performance.now()) {
    if (!this.enabled || this.cameraSessionId === cameraSessionId) return;
    this.reset(nowMs);
    this.cameraSessionId = cameraSessionId;
  }

  recordAngleCalculation(startedAtMs: number, endedAtMs: number, pose: FilteredRuntimePose, results: readonly RuntimeJointAngleResult[]) {
    if (!this.enabled) return;
    this.angleCalculationDurations.push(endedAtMs - startedAtMs);
    this.cameraSessionId = pose.cameraSessionId ?? null;
    this.latestFrameIndex = pose.frameIndex ?? null;
    this.latestPoseTimestampMs = pose.timestampMs;
    this.selectedAngles = results.map(({ metricId, status, valueDegrees, coordinateSpace }) => ({ metricId, status, valueDegrees, coordinateSpace }));
  }

  recordRenderingContext(input: NonNullable<CaptureRuntimeSnapshot["validation"]["renderingContext"]>) {
    if (this.enabled) this.renderingContext = { ...input };
  }

  recordReactRender(name: keyof CaptureRuntimeSnapshot["react"]) {
    if (!this.enabled) return;
    this.reactRenders[name] += 1;
  }

  recordCameraObservation(input: {
    sourceMediaTimestampMs: number;
    observedAtMs: number;
    videoReadyState: number;
  }) {
    if (!this.enabled || !Number.isFinite(input.sourceMediaTimestampMs)) return false;
    this.latestVideoReadyState = input.videoReadyState;
    if (input.sourceMediaTimestampMs === this.latestCameraFrameTimestampMs) return false;

    if (
      this.latestCameraFrameTimestampMs !== null &&
      this.lastInferredSourceTimestampMs !== this.latestCameraFrameTimestampMs
    ) {
      this.droppedOrSupersededFrameCount += 1;
    }
    if (this.latestCameraFrameObservedAtMs !== null) {
      this.cameraFrameIntervals.push(input.observedAtMs - this.latestCameraFrameObservedAtMs);
    }
    this.latestCameraFrameTimestampMs = input.sourceMediaTimestampMs;
    this.latestCameraFrameObservedAtMs = input.observedAtMs;
    this.cameraFrameCount += 1;
    this.cameraFrameTimestamps.push(input.observedAtMs);
    return true;
  }

  recordInferenceSkipped() {
    if (!this.enabled) return;
    this.inferenceSkippedCount += 1;
  }

  recordFrameCandidate() {
    if (this.enabled) this.candidateFrameCount += 1;
  }

  recordFrameCoalesced() {
    if (!this.enabled) return;
    this.coalescedCandidateCount += 1;
  }

  recordPendingFrameReplacement() {
    if (!this.enabled) return;
    this.pendingFrameReplacementCount += 1;
  }

  recordStaleResultRejected() {
    if (this.enabled) this.staleResultRejectedCount += 1;
  }

  recordAcceptedResultPublication(sourceFrameObservedAtMs?: number, publishedAtMs?: number) {
    if (!this.enabled) return;
    this.acceptedResultPublicationCount += 1;
    if (Number.isFinite(sourceFrameObservedAtMs) && Number.isFinite(publishedAtMs)) {
      this.sourceFrameToPublishLatencies.push(publishedAtMs! - sourceFrameObservedAtMs!);
    }
  }

  recordProducerPaused() {
    if (this.enabled) this.producerPauseCount += 1;
  }

  recordProducerResumed() {
    if (this.enabled) this.producerResumeCount += 1;
  }

  beginInference(input: {
    sourceMediaTimestampMs: number;
    sourceFrameObservedAtMs: number;
    startedAtMs: number;
  }) {
    if (!this.enabled) return null;
    this.sequenceId += 1;
    this.inferenceAttemptCount += 1;
    this.pendingInferenceCount += 1;
    this.maximumObservedPendingInference = Math.max(
      this.maximumObservedPendingInference,
      this.pendingInferenceCount,
    );
    this.lastInferredSourceTimestampMs = input.sourceMediaTimestampMs;
    return { sequenceId: this.sequenceId, ...input };
  }

  completeInference(
    token: {
      sequenceId: number;
      sourceMediaTimestampMs: number;
      sourceFrameObservedAtMs: number;
      startedAtMs: number;
    } | null,
    result: RawCanonicalPose,
    endedAtMs: number,
  ) {
    if (!this.enabled || !token) return;
    this.pendingInferenceCount = Math.max(0, this.pendingInferenceCount - 1);
    this.inferenceCompletedCount += 1;
    const durationMs = endedAtMs - token.startedAtMs;
    this.latestInferenceDurationMs = durationMs;
    this.latestResultSequenceId = token.sequenceId;
    this.inferenceDurations.push(durationMs);
    this.inferenceCompletionTimestamps.push(endedAtMs);
    this.inferenceWindows.push({ startMs: token.startedAtMs, endMs: endedAtMs });
    this.jitterFrames.push({ landmarks: result.landmarks2D.map((landmark) => ({ ...landmark })) });
    this.poseMetadata.set(result, {
      sequenceId: token.sequenceId,
      sourceMediaTimestampMs: token.sourceMediaTimestampMs,
      sourceFrameObservedAtMs: token.sourceFrameObservedAtMs,
      inferenceStartedAtMs: token.startedAtMs,
      producedAtMs: endedAtMs,
    });
  }

  failInference(
    token: { startedAtMs: number } | null,
    endedAtMs: number,
  ) {
    if (!this.enabled || !token) return;
    this.pendingInferenceCount = Math.max(0, this.pendingInferenceCount - 1);
    this.inferenceFailureCount += 1;
    this.inferenceWindows.push({ startMs: token.startedAtMs, endMs: endedAtMs });
  }

  associateRuntimePose(rawPose: RawCanonicalPose | null, filteredPose: FilteredRuntimePose | null) {
    if (!rawPose || !filteredPose) return;
    const metadata = this.poseMetadata.get(rawPose);
    if (metadata) this.poseMetadata.set(filteredPose, metadata);
  }

  recordRuntimePoseQualitySnapshot(snapshot: RuntimePoseQualityDiagnostics) {
    if (this.enabled) this.runtimeQualitySnapshot = snapshot;
  }

  getPoseResultMeasurement(result: RawCanonicalPose | FilteredRuntimePose | null) {
    return result ? this.poseMetadata.get(result) ?? null : null;
  }

  recordCanvasRender(input: {
    startedAtMs: number;
    endedAtMs: number;
    poseResult: RawCanonicalPose | FilteredRuntimePose | null;
    rendered: boolean;
  }) {
    if (!this.enabled) return;
    if (!input.rendered) {
      this.skippedCanvasRenderCount += 1;
      return;
    }

    this.canvasRenderCount += 1;
    const durationMs = input.endedAtMs - input.startedAtMs;
    this.latestRenderDurationMs = durationMs;
    this.renderDurations.push(durationMs);
    this.renderTimestamps.push(input.endedAtMs);
    this.renderWindows.push({ startMs: input.startedAtMs, endMs: input.endedAtMs });

    const metadata = this.getPoseResultMeasurement(input.poseResult);
    if (!metadata) return;
    if (metadata.sequenceId === this.lastRenderedPoseSequenceId) {
      this.repeatedRenderOfSamePoseCount += 1;
    }
    this.lastRenderedPoseSequenceId = metadata.sequenceId;
    const resultAgeMs = input.endedAtMs - metadata.producedAtMs;
    this.latestPoseResultAgeMs = resultAgeMs;
    this.poseResultAges.push(resultAgeMs);
    this.frameToOverlayProxy.push(input.endedAtMs - metadata.sourceFrameObservedAtMs);
  }

  recordPreviewSelection(input: {
    videoTimestampMs: number;
    poseTimestampMs: number | null;
    poseFrameIndex: number | null;
  }) {
    if (!this.enabled) return;
    const error = calculatePreviewSyncErrorMs(input.videoTimestampMs, input.poseTimestampMs);
    if (error === null) {
      this.previewUnavailableSelectionCount += 1;
      this.lastPreviewPoseFrameIndex = null;
      return;
    }
    this.previewSyncErrors.push(error);
    if (input.poseFrameIndex === this.lastPreviewPoseFrameIndex) {
      this.previewRepeatedPoseFrameCount += 1;
    }
    this.lastPreviewPoseFrameIndex = input.poseFrameIndex;
  }

  setLongTaskSupported(supported: boolean) {
    if (!this.enabled) return;
    this.longTaskSupported = supported;
  }

  recordLongTask(startMs: number, durationMs: number) {
    if (!this.enabled || !Number.isFinite(durationMs)) return;
    const longTask = { startMs, endMs: startMs + durationMs };
    this.longTaskCount += 1;
    this.longTaskDurations.push(durationMs);
    if (this.inferenceWindows.getValues().some((window) => overlaps(window, longTask))) {
      this.overlapWithInferenceCount += 1;
    }
    if (this.renderWindows.getValues().some((window) => overlaps(window, longTask))) {
      this.overlapWithRenderCount += 1;
    }
  }

  snapshot(): CaptureRuntimeSnapshot {
    const jitter = calculateStaticJitter(this.jitterFrames.getValues());
    return {
      enabled: this.enabled,
      generatedAt: new Date().toISOString(),
      sessionStartedAtMs: this.sessionStartedAtMs,
      validation: {
        cameraSessionId: this.cameraSessionId,
        frameIndex: this.latestFrameIndex,
        poseTimestampMs: this.latestPoseTimestampMs,
        angleCalculationDurationMs: summarizeNumericSamples(this.angleCalculationDurations.getValues()),
        selectedAngles: this.selectedAngles.map((item) => ({ ...item })),
        renderingContext: this.renderingContext ? { ...this.renderingContext } : null,
        sessionMismatchRejectedCount: null,
      },
      camera: {
        cameraFrameCount: this.cameraFrameCount,
        cameraFrameRate: rateFromTimestamps(this.cameraFrameTimestamps.getValues()),
        latestCameraFrameTimestampMs: this.latestCameraFrameTimestampMs,
        latestVideoReadyState: this.latestVideoReadyState,
        frameIntervalMs: summarizeNumericSamples(this.cameraFrameIntervals.getValues()),
      },
      inference: {
        candidateFrameCount: this.candidateFrameCount,
        inferenceAttemptCount: this.inferenceAttemptCount,
        inferenceCompletedCount: this.inferenceCompletedCount,
        inferenceSkippedCount: this.inferenceSkippedCount,
        inferenceFailureCount: this.inferenceFailureCount,
        inferenceFPS: rateFromTimestamps(this.inferenceCompletionTimestamps.getValues()),
        latestInferenceDurationMs: this.latestInferenceDurationMs,
        inferenceDurationMs: summarizeNumericSamples(this.inferenceDurations.getValues()),
        pendingInferenceCount: this.pendingInferenceCount,
        maximumObservedPendingInference: this.maximumObservedPendingInference,
        droppedOrSupersededFrameCount: this.droppedOrSupersededFrameCount,
        coalescedCandidateCount: this.coalescedCandidateCount,
        pendingFrameReplacementCount: this.pendingFrameReplacementCount,
        staleResultRejectedCount: this.staleResultRejectedCount,
        acceptedResultPublicationCount: this.acceptedResultPublicationCount,
        producerPauseCount: this.producerPauseCount,
        producerResumeCount: this.producerResumeCount,
        sourceFrameToPublishLatencyMs: summarizeNumericSamples(
          this.sourceFrameToPublishLatencies.getValues(),
        ),
      },
      poseResult: {
        latestResultSequenceId: this.latestResultSequenceId,
        latestPoseResultAgeMs: this.latestPoseResultAgeMs,
        poseResultAgeMs: summarizeNumericSamples(this.poseResultAges.getValues()),
        videoFrameToOverlayProxyMs: summarizeNumericSamples(this.frameToOverlayProxy.getValues()),
      },
      rendering: {
        canvasRenderCount: this.canvasRenderCount,
        renderFPS: rateFromTimestamps(this.renderTimestamps.getValues()),
        latestRenderDurationMs: this.latestRenderDurationMs,
        renderDurationMs: summarizeNumericSamples(this.renderDurations.getValues()),
        repeatedRenderOfSamePoseCount: this.repeatedRenderOfSamePoseCount,
        skippedCanvasRenderCount: this.skippedCanvasRenderCount,
      },
      react: { ...this.reactRenders },
      mainThread: {
        supported: this.longTaskSupported,
        longTaskCount: this.longTaskCount,
        longTaskDurationMs: summarizeNumericSamples(this.longTaskDurations.getValues()),
        overlapWithInferenceCount: this.overlapWithInferenceCount,
        overlapWithRenderCount: this.overlapWithRenderCount,
      },
      jitter: {
        status:
          jitter.frameSampleCount === 0
            ? "unavailable"
            : jitter.frameSampleCount < 20
              ? "collecting"
              : "ready",
        selectedLandmarkIds: [...JITTER_LANDMARK_IDS],
        ...jitter,
      },
      previewSync: {
        sampleCount: this.previewSyncErrors.size,
        errorMs: summarizeNumericSamples(this.previewSyncErrors.getValues()),
        repeatedPoseFrameCount: this.previewRepeatedPoseFrameCount,
        unavailableSelectionCount: this.previewUnavailableSelectionCount,
      },
      runtimeQuality: this.runtimeQualitySnapshot,
    };
  }
}

export function observeCaptureLongTasks(collector: CaptureRuntimeInstrumentation) {
  if (!collector.enabled || typeof PerformanceObserver === "undefined") {
    collector.setLongTaskSupported(false);
    return () => undefined;
  }

  const supported = PerformanceObserver.supportedEntryTypes?.includes("longtask") ?? false;
  collector.setLongTaskSupported(supported);
  if (!supported) return () => undefined;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => collector.recordLongTask(entry.startTime, entry.duration));
  });
  observer.observe({ entryTypes: ["longtask"] });
  return () => observer.disconnect();
}

export function serializeCaptureDiagnosticsSnapshot(snapshot: CaptureRuntimeSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}

export const captureRuntimeInstrumentation = new CaptureRuntimeInstrumentation();
