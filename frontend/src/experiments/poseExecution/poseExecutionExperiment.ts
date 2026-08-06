import { calculateSelectedRuntimeJointAngles, type JointAngleMetricId, type RuntimeJointAngleResult } from "../../engines/motionModel";
import { createRuntimePoseQualityEngine, type FilteredRuntimePose, type RawCanonicalPose } from "../../engines/pose";

export const POSE_EXECUTION_EXPERIMENT_PROTOCOL = "pose-execution-eval.v1" as const;

export type ExperimentFrameIdentity = Readonly<{
  cameraSessionId: number;
  frameIndex: number;
  timestampMs: number;
}>;

export type PoseExecutionRequest =
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "init"; profileId: string; metricIds: readonly JointAngleMetricId[] }>
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "process"; requestId: number; identity: ExperimentFrameIdentity; runtimeProfileId: string; selectedMetricIds: readonly JointAngleMetricId[]; rawPose: RawCanonicalPose }>
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "reset"; cameraSessionId: number }>
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "dispose" }>;

export type PoseExecutionResponse =
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "ready"; profileId: string }>
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "result"; requestId: number; identity: ExperimentFrameIdentity; filteredPose: FilteredRuntimePose; angles: readonly RuntimeJointAngleResult[]; timingDiagnostics: Readonly<{ processingDurationMs: number }> }>
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "processing-error"; requestId: number | null; message: string }>
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "reset-complete"; cameraSessionId: number }>
  | Readonly<{ protocol: typeof POSE_EXECUTION_EXPERIMENT_PROTOCOL; type: "disposed" }>;

/** Worker-side protocol core. It is deliberately not imported by production code. */
export class PosePostProcessingExperiment {
  private metricIds: readonly JointAngleMetricId[] | null = null;
  private profileId: string | null = null;
  private disposed = false;

  constructor(private readonly engine = createRuntimePoseQualityEngine()) {}

  tryHandle(request: unknown): PoseExecutionResponse {
    try {
      if (!request || typeof request !== "object" || !("type" in request) || !("protocol" in request)) throw new Error("Malformed pose execution experiment message");
      return this.handle(request as PoseExecutionRequest);
    } catch (error) {
      const requestId = request && typeof request === "object" && "requestId" in request && typeof request.requestId === "number" ? request.requestId : null;
      return { protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "processing-error", requestId, message: error instanceof Error ? error.message : "Unknown processing error" };
    }
  }

  handle(request: PoseExecutionRequest): PoseExecutionResponse {
    if (request.protocol !== POSE_EXECUTION_EXPERIMENT_PROTOCOL) throw new Error("Unsupported pose execution experiment protocol");
    if (this.disposed) throw new Error("Pose execution experiment is disposed");
    if (request.type === "init") {
      this.profileId = request.profileId;
      this.metricIds = Object.freeze([...request.metricIds]);
      return { protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "ready", profileId: request.profileId };
    }
    if (request.type === "reset") {
      this.engine.reset("session-change");
      return { protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "reset-complete", cameraSessionId: request.cameraSessionId };
    }
    if (request.type === "dispose") {
      this.engine.dispose();
      this.disposed = true;
      return { protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL, type: "disposed" };
    }
    if (!this.metricIds || !this.profileId) throw new Error("Pose execution experiment must be initialized");
    if (request.runtimeProfileId !== this.profileId || request.selectedMetricIds.join("\u0000") !== this.metricIds.join("\u0000")) throw new Error("Process profile does not match initialized profile");
    const rawIdentity = {
      cameraSessionId: request.rawPose.cameraSessionId,
      frameIndex: request.rawPose.frameIndex,
      timestampMs: request.rawPose.timestampMs,
    };
    if (rawIdentity.cameraSessionId !== request.identity.cameraSessionId || rawIdentity.frameIndex !== request.identity.frameIndex || rawIdentity.timestampMs !== request.identity.timestampMs) {
      throw new Error("Process identity does not match RawCanonicalPose identity");
    }
    const startedAtMs = performance.now();
    const filteredPose = this.engine.transform(request.rawPose);
    if (!filteredPose) throw new Error("A valid RawCanonicalPose must produce a filtered pose");
    return {
      protocol: POSE_EXECUTION_EXPERIMENT_PROTOCOL,
      type: "result",
      requestId: request.requestId,
      identity: request.identity,
      filteredPose,
      angles: calculateSelectedRuntimeJointAngles(filteredPose, this.metricIds),
      timingDiagnostics: { processingDurationMs: performance.now() - startedAtMs },
    };
  }
}

export type ExperimentQueueItem<T> = Readonly<{ identity: ExperimentFrameIdentity; payload: T }>;

/** At most one active item plus one replaceable pending item. */
export class LatestFrameWinsExperimentQueue<T, R> {
  private active: ExperimentQueueItem<T> | null = null;
  private pending: ExperimentQueueItem<T> | null = null;
  private sessionId = 0;
  private disposed = false;

  constructor(
    private readonly process: (item: ExperimentQueueItem<T>) => Promise<R>,
    private readonly publish: (value: R, item: ExperimentQueueItem<T>) => void,
    private readonly onProcessingError: (error: unknown, item: ExperimentQueueItem<T>) => void = () => undefined,
  ) {}

  accept(item: ExperimentQueueItem<T>) {
    if (this.disposed || item.identity.cameraSessionId !== this.sessionId) return false;
    if (this.active) this.pending = item;
    else this.start(item);
    return true;
  }

  rotateSession(sessionId: number) { this.sessionId = sessionId; this.pending = null; }
  dispose() { this.disposed = true; this.pending = null; }
  snapshot() { return { active: this.active ? 1 : 0, pending: this.pending ? 1 : 0, sessionId: this.sessionId, disposed: this.disposed }; }

  private start(item: ExperimentQueueItem<T>) {
    this.active = item;
    let processing: Promise<R>;
    try {
      processing = this.process(item);
    } catch (error) {
      processing = Promise.reject(error);
    }
    void processing.then((value) => {
      if (!this.disposed && item.identity.cameraSessionId === this.sessionId) this.publish(value, item);
    }, (error) => {
      this.onProcessingError(error, item);
    }).finally(() => {
      if (this.active === item) this.active = null;
      const next = this.pending;
      this.pending = null;
      if (next && !this.disposed && next.identity.cameraSessionId === this.sessionId) this.start(next);
    });
  }
}

export type BoundedTimingSummary = Readonly<{ count: number; min: number; median: number; mean: number; p95: number; max: number }>;

export function summarizeBoundedTimings(samples: readonly number[], maximumSamples = 300): BoundedTimingSummary {
  if (samples.length === 0) throw new Error("At least one timing sample is required");
  if (maximumSamples < 1) throw new Error("maximumSamples must be positive");
  const bounded = samples.slice(-maximumSamples).filter(Number.isFinite).sort((a, b) => a - b);
  if (bounded.length === 0) throw new Error("At least one finite timing sample is required");
  const percentile = (fraction: number) => bounded[Math.ceil(fraction * bounded.length) - 1];
  return Object.freeze({ count: bounded.length, min: bounded[0], median: percentile(0.5), mean: bounded.reduce((sum, value) => sum + value, 0) / bounded.length, p95: percentile(0.95), max: bounded[bounded.length - 1] });
}

export type SerializationExperimentResult = Readonly<{
  warmupIterations: number;
  sampleCount: number;
  jsonPayloadBytes: number;
  structuredClone: BoundedTimingSummary;
  jsonRoundTripReference: BoundedTimingSummary;
}>;

/** Reference benchmark only; JSON is intentionally not part of the proposed runtime protocol. */
export function measureSerializationExperiment<T>(payload: T, options: Readonly<{ warmupIterations?: number; sampleCount?: number }> = {}): SerializationExperimentResult {
  const warmupIterations = options.warmupIterations ?? 10;
  const sampleCount = options.sampleCount ?? 100;
  if (warmupIterations < 0 || sampleCount < 1 || sampleCount > 300) throw new Error("Invalid bounded experiment iteration count");
  const json = JSON.stringify(payload);
  const measure = (operation: () => void) => {
    for (let index = 0; index < warmupIterations; index += 1) operation();
    return Array.from({ length: sampleCount }, () => {
      const start = performance.now(); operation(); return performance.now() - start;
    });
  };
  const cloneSamples = measure(() => { structuredClone(payload); });
  const jsonSamples = measure(() => { JSON.parse(json) as unknown; });
  return Object.freeze({ warmupIterations, sampleCount, jsonPayloadBytes: new TextEncoder().encode(json).byteLength, structuredClone: summarizeBoundedTimings(cloneSamples), jsonRoundTripReference: summarizeBoundedTimings(jsonSamples) });
}
