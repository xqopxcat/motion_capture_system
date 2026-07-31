import { afterEach, describe, expect, it, vi } from "vitest";
import { captureVideoFrame } from "./capturedVideoFrame";

afterEach(() => vi.unstubAllGlobals());

describe("captured video frame", () => {
  it("keeps the image captured at its source timestamp after video advancement", () => {
    const canvas = { width: 0, height: 0, capturedMediaTime: -1, getContext: () => ({ drawImage }) };
    const video = { videoWidth: 640, videoHeight: 480, currentTime: 1 } as HTMLVideoElement;
    const drawImage = vi.fn((source: HTMLVideoElement) => {
      canvas.capturedMediaTime = source.currentTime;
    });
    vi.stubGlobal("document", {
      createElement: () => canvas,
    });

    const frame = captureVideoFrame(video, { sourceTimestampMs: 1000, observedAtMs: 25 });
    video.currentTime = 2;

    expect(frame).toMatchObject({ sourceTimestampMs: 1000, observedAtMs: 25 });
    expect((frame?.source as HTMLCanvasElement & { capturedMediaTime: number }).capturedMediaTime).toBe(1);
    expect(drawImage).toHaveBeenCalledTimes(1);
    frame?.release();
    expect(frame?.source).toMatchObject({ width: 0, height: 0 });
  });
});
