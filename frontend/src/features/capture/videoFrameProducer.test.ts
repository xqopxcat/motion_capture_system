import { afterEach, describe, expect, it, vi } from "vitest";
import { createVideoFrameProducer } from "./videoFrameProducer";

afterEach(() => vi.unstubAllGlobals());

describe("video frame producer", () => {
  it("prefers one video-frame callback loop and cancels it", () => {
    let callback: ((now: number, metadata: { mediaTime: number }) => void) | undefined;
    const request = vi.fn((next) => { callback = next; return 4; });
    const cancel = vi.fn();
    const video = { requestVideoFrameCallback: request, cancelVideoFrameCallback: cancel } as unknown as HTMLVideoElement;
    const onFrame = vi.fn();
    const producer = createVideoFrameProducer(video, onFrame);
    expect(producer.source).toBe("video-frame-callback");
    producer.start();
    producer.start();
    expect(request).toHaveBeenCalledTimes(1);
    callback?.(12, { mediaTime: 0.5 });
    expect(onFrame).toHaveBeenCalledWith({ observedAtMs: 12, sourceTimestampMs: 500 });
    expect(request).toHaveBeenCalledTimes(2);
    producer.pause();
    expect(cancel).toHaveBeenCalledWith(4);
    producer.start();
    expect(request).toHaveBeenCalledTimes(3);
    producer.dispose();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it("uses rAF fallback, suppresses duplicate media frames, and cleans up", () => {
    let callback: FrameRequestCallback | undefined;
    const request = vi.fn((next: FrameRequestCallback) => { callback = next; return 9; });
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const video = { currentTime: 1 } as HTMLVideoElement;
    const onFrame = vi.fn();
    const producer = createVideoFrameProducer(video, onFrame);
    expect(producer.source).toBe("animation-frame");
    producer.start();
    callback?.(10);
    callback?.(20);
    expect(onFrame).toHaveBeenCalledTimes(1);
    producer.dispose();
    expect(cancel).toHaveBeenCalledWith(9);
  });
});
