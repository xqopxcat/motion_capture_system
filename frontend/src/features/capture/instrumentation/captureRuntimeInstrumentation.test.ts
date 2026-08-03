import { describe, expect, it } from "vitest";
import { mapPoseDetectionResultToRawCanonicalPose } from "../../../engines/pose";
import type { PoseLandmark2D, RawCanonicalPose } from "../../../engines/pose";
import {
  BoundedSampleBuffer,
  CaptureRuntimeInstrumentation,
  calculatePreviewSyncErrorMs,
  calculateStaticJitter,
  resolveCaptureDiagnosticsEnabled,
  summarizeNumericSamples,
} from "./captureRuntimeInstrumentation";

function landmark(id: number, x: number, y: number, visibility = 1): PoseLandmark2D {
  return { id, name: `joint_${id}`, x, y, visibility };
}

function result(frameIndex: number): RawCanonicalPose {
  const landmarks = Array.from({ length: 33 }, (_, id) =>
    landmark(id, id === 11 ? 0.2 : id === 12 ? 0.8 : 0.5, 0.3));
  return mapPoseDetectionResultToRawCanonicalPose({
    engineName: "test",
    engineVersion: "1",
    frameIndex,
    timestampMs: frameIndex * 33,
    landmarks2D: landmarks,
    landmarks3D: [],
  }, { sourceTimestampMs: frameIndex * 33, frameIndex });
}

describe("Capture runtime instrumentation", () => {
  it("keeps bounded samples", () => {
    const buffer = new BoundedSampleBuffer<number>(3);
    [1, 2, 3, 4].forEach((value) => buffer.push(value));
    expect(buffer.getValues()).toEqual([2, 3, 4]);
    buffer.clear();
    expect(buffer.getValues()).toEqual([]);
  });

  it("summarizes deterministic numeric samples and withholds low-count P95", () => {
    expect(summarizeNumericSamples([])).toMatchObject({ count: 0, mean: null, p95: null });
    expect(summarizeNumericSamples([1, 2, Number.NaN, 3])).toMatchObject({
      count: 3,
      min: 1,
      max: 3,
      mean: 2,
      p50: 2,
      p95: null,
    });
    expect(summarizeNumericSamples(Array.from({ length: 20 }, (_, index) => index + 1)).p95)
      .toBeCloseTo(19.05);
  });

  it("calculates jitter and excludes low-visibility landmarks", () => {
    const frames = [
      { landmarks: [landmark(11, 0, 0), landmark(12, 1, 1, 0.1)] },
      { landmarks: [landmark(11, 0.02, 0), landmark(12, 1, 1, 0.1)] },
      { landmarks: [landmark(11, -0.02, 0), landmark(12, 1, 1, 0.1)] },
    ];
    const jitter = calculateStaticJitter(frames, [11, 12], 0.5);
    expect(jitter.frameSampleCount).toBe(3);
    expect(jitter.excludedLowVisibilitySampleCount).toBe(3);
    expect(jitter.perLandmarkNormalizedRms["11"]).toBeGreaterThan(0);
    expect(jitter.perLandmarkNormalizedRms["12"]).toBeUndefined();
  });

  it("calculates preview sync error and handles unavailable input", () => {
    expect(calculatePreviewSyncErrorMs(100, 85)).toBe(15);
    expect(calculatePreviewSyncErrorMs(100, null)).toBeNull();
    expect(calculatePreviewSyncErrorMs(Number.NaN, 85)).toBeNull();
  });

  it("correlates sequence, pending inference, render age, skips, and reset", () => {
    const collector = new CaptureRuntimeInstrumentation(true);
    collector.reset(0);
    collector.recordCameraObservation({
      sourceMediaTimestampMs: 10,
      observedAtMs: 5,
      videoReadyState: 4,
    });
    collector.recordInferenceSkipped();
    collector.recordFrameCandidate();
    collector.recordFrameCoalesced();
    collector.recordPendingFrameReplacement();
    collector.recordStaleResultRejected();
    collector.recordAcceptedResultPublication(5, 18);
    collector.recordProducerPaused();
    collector.recordProducerResumed();
    const token = collector.beginInference({
      sourceMediaTimestampMs: 10,
      sourceFrameObservedAtMs: 5,
      startedAtMs: 7,
    });
    expect(collector.snapshot().inference.pendingInferenceCount).toBe(1);
    const pose = result(1);
    collector.completeInference(token, pose, 17);
    collector.recordCanvasRender({
      startedAtMs: 20,
      endedAtMs: 21,
      poseResult: pose,
      rendered: true,
    });
    const snapshot = collector.snapshot();
    expect(snapshot.inference).toMatchObject({
      inferenceAttemptCount: 1,
      inferenceCompletedCount: 1,
      inferenceSkippedCount: 1,
      candidateFrameCount: 1,
      coalescedCandidateCount: 1,
      pendingFrameReplacementCount: 1,
      staleResultRejectedCount: 1,
      acceptedResultPublicationCount: 1,
      producerPauseCount: 1,
      producerResumeCount: 1,
      pendingInferenceCount: 0,
      maximumObservedPendingInference: 1,
      latestInferenceDurationMs: 10,
    });
    expect(snapshot.inference.sourceFrameToPublishLatencyMs.mean).toBe(13);
    expect(snapshot.poseResult.latestResultSequenceId).toBe(1);
    expect(snapshot.poseResult.latestPoseResultAgeMs).toBe(4);
    expect(snapshot.poseResult.videoFrameToOverlayProxyMs.mean).toBe(16);

    collector.reset(50);
    expect(collector.snapshot().inference.inferenceAttemptCount).toBe(0);
    expect(collector.snapshot().rendering.canvasRenderCount).toBe(0);
  });

  it("has a side-effect-free disabled path", () => {
    const collector = new CaptureRuntimeInstrumentation(false);
    collector.recordInferenceSkipped();
    collector.recordReactRender("CapturePage");
    collector.recordPreviewSelection({
      videoTimestampMs: 100,
      poseTimestampMs: 90,
      poseFrameIndex: 1,
    });
    expect(collector.snapshot()).toMatchObject({
      enabled: false,
      inference: { inferenceSkippedCount: 0 },
      react: { CapturePage: 0 },
      previewSync: { sampleCount: 0 },
    });
  });

  it("enables diagnostics only through explicit development flags", () => {
    expect(resolveCaptureDiagnosticsEnabled({ isDevelopment: false, queryValue: "1" })).toBe(false);
    expect(resolveCaptureDiagnosticsEnabled({ isDevelopment: true, queryValue: "1" })).toBe(true);
    expect(
      resolveCaptureDiagnosticsEnabled({ isDevelopment: true, environmentValue: "true" }),
    ).toBe(true);
    expect(resolveCaptureDiagnosticsEnabled({ isDevelopment: true })).toBe(false);
  });
});
