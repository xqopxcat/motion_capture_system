export const LATEST_FRAME_SCHEDULING_POLICY = {
  maximumInFlightInferenceCount: 1,
  pendingFrameCapacity: 1,
  replacementPolicy: "latest-frame-wins",
  publicationPolicy: "latest-valid-result",
} as const;

export type RuntimeFrameIdentity = {
  generation: number;
  cameraSessionId: number;
  frameSequence: number;
};

export type ScheduledFrame<T> = RuntimeFrameIdentity & {
  payload: T;
  sourceTimestampMs: number;
  observedAtMs: number;
};

export type LatestFrameSchedulerEvents<T, R> = {
  infer: (frame: ScheduledFrame<T>) => Promise<R>;
  publish: (result: R, frame: ScheduledFrame<T>, publishedAtMs: number) => void;
  onInferenceStarted?: (frame: ScheduledFrame<T>) => void;
  onInferenceCompleted?: (frame: ScheduledFrame<T>, result: R, completedAtMs: number) => void;
  onInferenceFailed?: (frame: ScheduledFrame<T>, error: unknown) => void;
  onFrameCoalesced?: (frame: ScheduledFrame<T>) => void;
  onPendingFrameReplaced?: (frame: ScheduledFrame<T>) => void;
  onStaleResultRejected?: (frame: ScheduledFrame<T>) => void;
  now?: () => number;
};

export class LatestFrameScheduler<T, R> {
  private generation = 1;
  private cameraSessionId = 0;
  private frameSequence = 0;
  private activeFrame: ScheduledFrame<T> | null = null;
  private pendingFrame: ScheduledFrame<T> | null = null;
  private latestPublishedSequence = 0;
  private disposed = false;
  private paused = false;

  constructor(private readonly events: LatestFrameSchedulerEvents<T, R>) {}

  accept(input: Omit<ScheduledFrame<T>, keyof RuntimeFrameIdentity>) {
    if (this.disposed || this.paused) return null;
    const frame: ScheduledFrame<T> = {
      ...input,
      generation: this.generation,
      cameraSessionId: this.cameraSessionId,
      frameSequence: ++this.frameSequence,
    };
    if (!this.activeFrame) this.start(frame);
    else {
      if (this.pendingFrame) {
        this.events.onFrameCoalesced?.(this.pendingFrame);
        this.events.onPendingFrameReplaced?.(this.pendingFrame);
      }
      this.pendingFrame = frame;
    }
    return frame;
  }

  rotateSession(cameraSessionId: number) {
    if (this.pendingFrame) this.events.onFrameCoalesced?.(this.pendingFrame);
    this.pendingFrame = null;
    this.generation += 1;
    this.cameraSessionId = cameraSessionId;
    this.frameSequence = 0;
    this.latestPublishedSequence = 0;
  }

  pause() {
    if (this.paused || this.disposed) return;
    this.paused = true;
    this.rotateSession(this.cameraSessionId);
  }

  resume() {
    if (!this.disposed) this.paused = false;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.pendingFrame) this.events.onFrameCoalesced?.(this.pendingFrame);
    this.pendingFrame = null;
    this.generation += 1;
  }

  snapshot() {
    return {
      activeInferenceCount: this.activeFrame ? 1 : 0,
      pendingFrameCount: this.pendingFrame ? 1 : 0,
      generation: this.generation,
      cameraSessionId: this.cameraSessionId,
      disposed: this.disposed,
      paused: this.paused,
    };
  }

  private start(frame: ScheduledFrame<T>) {
    this.activeFrame = frame;
    this.events.onInferenceStarted?.(frame);
    void this.events.infer(frame).then(
      (result) => {
        const completedAtMs = this.events.now?.() ?? performance.now();
        this.events.onInferenceCompleted?.(frame, result, completedAtMs);
        if (this.isPublishable(frame)) {
          this.latestPublishedSequence = frame.frameSequence;
          this.events.publish(result, frame, completedAtMs);
        } else {
          this.events.onStaleResultRejected?.(frame);
        }
      },
      (error) => this.events.onInferenceFailed?.(frame, error),
    ).finally(() => {
      if (this.activeFrame === frame) this.activeFrame = null;
      const pending = this.pendingFrame;
      this.pendingFrame = null;
      if (pending && !this.disposed && !this.paused && pending.generation === this.generation) {
        this.start(pending);
      }
    });
  }

  private isPublishable(frame: ScheduledFrame<T>) {
    return !this.disposed && !this.paused && frame.generation === this.generation &&
      frame.cameraSessionId === this.cameraSessionId &&
      frame.frameSequence > this.latestPublishedSequence;
  }
}
