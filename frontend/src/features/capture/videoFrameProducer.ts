export const LIVE_FRAME_PRODUCER_POLICY = {
  preferredProducer: "requestVideoFrameCallback",
  fallbackProducer: "requestAnimationFrame",
  minimumInferenceIntervalMs: 66,
} as const;

export type VideoFrameCandidate = {
  sourceTimestampMs: number;
  observedAtMs: number;
};

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number, metadata: { mediaTime: number }) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export type VideoFrameProducer = {
  readonly source: "video-frame-callback" | "animation-frame";
  start(): void;
  pause(): void;
  dispose(): void;
};

export function createVideoFrameProducer(
  video: HTMLVideoElement,
  onFrame: (candidate: VideoFrameCandidate) => void,
): VideoFrameProducer {
  const source = typeof (video as VideoWithFrameCallback).requestVideoFrameCallback === "function"
    ? "video-frame-callback" : "animation-frame";
  let running = false;
  let disposed = false;
  let callbackId: number | null = null;
  let lastMediaTimestampMs: number | null = null;

  const schedule = () => {
    if (!running || disposed) return;
    if (source === "video-frame-callback") {
      callbackId = (video as VideoWithFrameCallback).requestVideoFrameCallback!((now, metadata) => {
        callbackId = null;
        if (!running || disposed) return;
        onFrame({ observedAtMs: now, sourceTimestampMs: metadata.mediaTime * 1000 });
        schedule();
      });
      return;
    }
    callbackId = requestAnimationFrame((now) => {
      callbackId = null;
      if (!running || disposed) return;
      const sourceTimestampMs = video.currentTime * 1000;
      if (sourceTimestampMs !== lastMediaTimestampMs) {
        lastMediaTimestampMs = sourceTimestampMs;
        onFrame({ observedAtMs: now, sourceTimestampMs });
      }
      schedule();
    });
  };

  const cancel = () => {
    if (callbackId === null) return;
    if (source === "video-frame-callback") {
      (video as VideoWithFrameCallback).cancelVideoFrameCallback?.(callbackId);
    } else cancelAnimationFrame(callbackId);
    callbackId = null;
  };

  return {
    source,
    start() {
      if (running || disposed) return;
      running = true;
      schedule();
    },
    pause() {
      running = false;
      cancel();
    },
    dispose() {
      running = false;
      disposed = true;
      cancel();
    },
  };
}
