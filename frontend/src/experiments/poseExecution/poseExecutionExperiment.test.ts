import { describe, expect, it, vi } from "vitest";
import { mapPoseDetectionResultToRawCanonicalPose, type PoseDetectionResult } from "../../engines/pose";
import { CAPTURE_ANGLE_INTEGRATION_PROFILE } from "../../features/capture/captureAngleIntegrationProfile";
import { LatestFrameWinsExperimentQueue, measureSerializationExperiment, POSE_EXECUTION_EXPERIMENT_PROTOCOL, PosePostProcessingExperiment, summarizeBoundedTimings, type ExperimentFrameIdentity } from "./poseExecutionExperiment";

function raw(frameIndex = 1, cameraSessionId = 0) {
  const landmarks2D = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: id / 40, y: id / 50, visibility: 0.99 }));
  const landmarks3D = landmarks2D.map((point) => ({ ...point, z: point.id / 60 }));
  return mapPoseDetectionResultToRawCanonicalPose({ engineName: "experiment-fixture", engineVersion: "1", timestampMs: frameIndex * 33, frameIndex, landmarks2D, landmarks3D } satisfies PoseDetectionResult, { sourceTimestampMs: frameIndex * 33, frameIndex, cameraSessionId });
}

const identity = (frameIndex: number, cameraSessionId = 0): ExperimentFrameIdentity => ({ frameIndex, cameraSessionId, timestampMs: frameIndex * 33 });
const processRequest = (frameIndex = 1, cameraSessionId = 0) => ({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "process" as const, requestId: frameIndex, identity: identity(frameIndex, cameraSessionId), runtimeProfileId: CAPTURE_ANGLE_INTEGRATION_PROFILE.id, selectedMetricIds: CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds, rawPose: raw(frameIndex, cameraSessionId) });
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

describe("Task 82 isolated pose execution experiment", () => {
  it("requires initialization and rejects protocol mismatches", () => {
    const experiment = new PosePostProcessingExperiment();
    expect(() => experiment.handle(processRequest())).toThrow("initialized");
    expect(() => experiment.handle({ protocol: "future" as typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "reset", cameraSessionId: 0 })).toThrow("Unsupported");
  });

  it("preserves frame identity, fixed topology, and runtime-angle semantics", () => {
    const experiment = new PosePostProcessingExperiment();
    expect(experiment.handle({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "init", profileId: CAPTURE_ANGLE_INTEGRATION_PROFILE.id, metricIds: CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds })).toMatchObject({ type: "ready" });
    const response = experiment.handle(processRequest(7, 2));
    expect(response.type).toBe("result");
    if (response.type !== "result") throw new Error("expected result");
    expect(response.identity).toEqual(identity(7, 2));
    expect(response.requestId).toBe(7);
    expect(response.timingDiagnostics.processingDurationMs).toBeGreaterThanOrEqual(0);
    expect(response.filteredPose.landmarks2D).toHaveLength(33);
    expect(response.filteredPose.landmarks3D).toHaveLength(33);
    expect(response.filteredPose.landmarks2D.every((point, index) => point === null || point.id === index)).toBe(true);
    expect(response.angles.map(({ metricId }) => metricId)).toEqual(CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds);
  });

  it("represents malformed and processing failures without corrupting later requests", () => {
    const experiment = new PosePostProcessingExperiment();
    expect(experiment.tryHandle({ type: "unknown", protocol: "future", requestId: 9 })).toMatchObject({ type: "processing-error", requestId: 9 });
    experiment.handle({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "init", profileId: CAPTURE_ANGLE_INTEGRATION_PROFILE.id, metricIds: CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds });
    expect(experiment.tryHandle({ ...processRequest(), runtimeProfileId: "wrong" })).toMatchObject({ type: "processing-error", requestId: 1 });
    expect(experiment.tryHandle(processRequest(2))).toMatchObject({ type: "result", requestId: 2 });
  });

  it("resets temporal state and prevents use after dispose", () => {
    const experiment = new PosePostProcessingExperiment();
    experiment.handle({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "init", profileId: "test", metricIds: CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds });
    expect(experiment.handle({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "reset", cameraSessionId: 4 })).toEqual({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "reset-complete", cameraSessionId: 4 });
    expect(experiment.handle({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "dispose" })).toMatchObject({ type: "disposed" });
    expect(() => experiment.handle({ protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "reset", cameraSessionId: 5 })).toThrow("disposed");
  });

  it("keeps one active and only the newest pending frame", async () => {
    let release!: (value: number) => void;
    const first = new Promise<number>((resolve) => { release = resolve; });
    const process = vi.fn(({ identity: itemIdentity }: { identity: ExperimentFrameIdentity }) => itemIdentity.frameIndex === 1 ? first : Promise.resolve(itemIdentity.frameIndex));
    const publish = vi.fn();
    const queue = new LatestFrameWinsExperimentQueue(process, publish);
    queue.accept({ identity: identity(1), payload: null });
    queue.accept({ identity: identity(2), payload: null });
    queue.accept({ identity: identity(3), payload: null });
    expect(queue.snapshot()).toMatchObject({ active: 1, pending: 1 });
    release(1);
    await flush();
    expect(process.mock.calls.map(([item]) => item.identity.frameIndex)).toEqual([1, 3]);
    expect(publish.mock.calls.map(([, item]) => item.identity.frameIndex)).toEqual([1, 3]);
  });

  it("rejects stale sessions and suppresses an in-flight old-session result", async () => {
    let release!: (value: number) => void;
    const process = vi.fn(() => new Promise<number>((resolve) => { release = resolve; }));
    const publish = vi.fn();
    const queue = new LatestFrameWinsExperimentQueue(process, publish);
    queue.accept({ identity: identity(1), payload: null });
    queue.rotateSession(2);
    expect(queue.accept({ identity: identity(2, 1), payload: null })).toBe(false);
    release(1);
    await flush();
    expect(publish).not.toHaveBeenCalled();
  });

  it("suppresses publication after disposal", async () => {
    let release!: (value: number) => void;
    const publish = vi.fn();
    const queue = new LatestFrameWinsExperimentQueue(() => new Promise<number>((resolve) => { release = resolve; }), publish);
    queue.accept({ identity: identity(1), payload: null });
    queue.dispose(); release(1); await flush();
    expect(publish).not.toHaveBeenCalled();
    expect(queue.snapshot()).toMatchObject({ pending: 0, disposed: true });
  });

  it("reports bounded distribution statistics instead of per-frame logs", () => {
    expect(summarizeBoundedTimings([100, 1, 2, 3, 4], 4)).toEqual({ count: 4, min: 1, median: 2, mean: 2.5, p95: 4, max: 4 });
    expect(() => summarizeBoundedTimings([])).toThrow();
  });

  it("separates warmup from bounded structured-clone and JSON reference samples", () => {
    const result = measureSerializationExperiment(raw(), { warmupIterations: 2, sampleCount: 5 });
    expect(result).toMatchObject({ warmupIterations: 2, sampleCount: 5 });
    expect(result.jsonPayloadBytes).toBeGreaterThan(0);
    expect(result.structuredClone.count).toBe(5);
    expect(result.jsonRoundTripReference.count).toBe(5);
  });
});
