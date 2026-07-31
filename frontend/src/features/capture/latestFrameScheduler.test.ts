import { describe, expect, it, vi } from "vitest";
import { LatestFrameScheduler } from "./latestFrameScheduler";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("LatestFrameScheduler", () => {
  it("runs first immediately and coalesces bounded pending frames", async () => {
    const jobs = [deferred<string>(), deferred<string>()];
    const infer = vi.fn((_frame) => jobs[infer.mock.calls.length - 1].promise);
    const publish = vi.fn();
    const coalesced = vi.fn();
    const scheduler = new LatestFrameScheduler({ infer, publish, onFrameCoalesced: coalesced, now: () => 10 });
    scheduler.rotateSession(7);

    scheduler.accept({ payload: "one", sourceTimestampMs: 1, observedAtMs: 1 });
    scheduler.accept({ payload: "two", sourceTimestampMs: 2, observedAtMs: 2 });
    scheduler.accept({ payload: "three", sourceTimestampMs: 3, observedAtMs: 3 });
    expect(infer).toHaveBeenCalledTimes(1);
    expect(scheduler.snapshot()).toMatchObject({ activeInferenceCount: 1, pendingFrameCount: 1 });
    expect(coalesced.mock.calls[0][0].payload).toBe("two");

    jobs[0].resolve("result-one");
    await flush();
    expect(infer).toHaveBeenCalledTimes(2);
    expect(infer.mock.calls[1][0].payload).toBe("three");
    jobs[1].resolve("result-three");
    await flush();
    expect(publish.mock.calls.map((call) => call[0])).toEqual(["result-one", "result-three"]);
    expect(scheduler.snapshot()).toMatchObject({ activeInferenceCount: 0, pendingFrameCount: 0 });
  });

  it("releases the slot and continues after a recoverable failure", async () => {
    const first = deferred<string>();
    const infer = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce("latest");
    const failed = vi.fn();
    const publish = vi.fn();
    const scheduler = new LatestFrameScheduler({ infer, publish, onInferenceFailed: failed });
    scheduler.accept({ payload: "one", sourceTimestampMs: 1, observedAtMs: 1 });
    scheduler.accept({ payload: "two", sourceTimestampMs: 2, observedAtMs: 2 });
    first.reject(new Error("recoverable"));
    await flush();
    await flush();
    expect(failed).toHaveBeenCalledTimes(1);
    expect(infer).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenCalledWith("latest", expect.objectContaining({ payload: "two" }), expect.any(Number));
  });

  it("rejects obsolete, rotated, paused, and disposed results", async () => {
    const old = deferred<string>();
    const stale = vi.fn();
    const publish = vi.fn();
    const scheduler = new LatestFrameScheduler({ infer: () => old.promise, publish, onStaleResultRejected: stale });
    scheduler.rotateSession(1);
    scheduler.accept({ payload: "old", sourceTimestampMs: 1, observedAtMs: 1 });
    scheduler.accept({ payload: "pending", sourceTimestampMs: 2, observedAtMs: 2 });
    scheduler.rotateSession(2);
    expect(scheduler.snapshot().pendingFrameCount).toBe(0);
    old.resolve("old-result");
    await flush();
    expect(stale).toHaveBeenCalledTimes(1);
    expect(publish).not.toHaveBeenCalled();

    const disposedJob = deferred<string>();
    const disposed = new LatestFrameScheduler({ infer: () => disposedJob.promise, publish, onStaleResultRejected: stale });
    disposed.accept({ payload: "disposed", sourceTimestampMs: 3, observedAtMs: 3 });
    disposed.dispose();
    disposedJob.resolve("ignored");
    await flush();
    expect(stale).toHaveBeenCalledTimes(2);
    expect(disposed.snapshot()).toMatchObject({ disposed: true, pendingFrameCount: 0 });
  });

  it("owns and releases replaced, completed, rotated, paused, and disposed frames", async () => {
    const active = deferred<string>();
    const releases: string[] = [];
    const scheduler = new LatestFrameScheduler<string, string>({
      infer: vi.fn().mockReturnValueOnce(active.promise),
      publish: vi.fn(),
      releaseFrame: (frame) => releases.push(frame.payload),
    });
    scheduler.rotateSession(1);
    scheduler.accept({ payload: "active", sourceTimestampMs: 1, observedAtMs: 1 });
    scheduler.accept({ payload: "replaced", sourceTimestampMs: 2, observedAtMs: 2 });
    scheduler.accept({ payload: "pending", sourceTimestampMs: 3, observedAtMs: 3 });
    expect(releases).toEqual(["replaced"]);
    scheduler.pause();
    expect(releases).toEqual(["replaced", "pending"]);
    scheduler.accept({ payload: "rejected-while-paused", sourceTimestampMs: 4, observedAtMs: 4 });
    expect(releases).toContain("rejected-while-paused");
    active.resolve("done");
    await flush();
    expect(releases).toContain("active");

    const successful = new LatestFrameScheduler<string, string>({
      infer: () => Promise.resolve("success"),
      publish: vi.fn(),
      releaseFrame: (frame) => releases.push(frame.payload),
    });
    successful.accept({ payload: "successful", sourceTimestampMs: 4.5, observedAtMs: 4.5 });
    await flush();
    expect(releases).toContain("successful");

    const rotating = new LatestFrameScheduler<string, string>({
      infer: () => new Promise(() => undefined),
      publish: vi.fn(),
      releaseFrame: (frame) => releases.push(frame.payload),
    });
    rotating.accept({ payload: "rotation-active", sourceTimestampMs: 5, observedAtMs: 5 });
    rotating.accept({ payload: "rotation-pending", sourceTimestampMs: 6, observedAtMs: 6 });
    rotating.rotateSession(2);
    expect(releases).toContain("rotation-pending");

    const disposing = new LatestFrameScheduler<string, string>({
      infer: () => new Promise(() => undefined),
      publish: vi.fn(),
      releaseFrame: (frame) => releases.push(frame.payload),
    });
    disposing.accept({ payload: "dispose-active", sourceTimestampMs: 7, observedAtMs: 7 });
    disposing.accept({ payload: "dispose-pending", sourceTimestampMs: 8, observedAtMs: 8 });
    disposing.dispose();
    expect(releases).toContain("dispose-pending");
  });

  it("passes the pending image and timestamp accepted before later video advancement", async () => {
    const first = deferred<string>();
    const inferred: Array<{ image: string; timestamp: number }> = [];
    const scheduler = new LatestFrameScheduler<{ image: string }, string>({
      infer: (frame) => {
        inferred.push({ image: frame.payload.image, timestamp: frame.sourceTimestampMs });
        return inferred.length === 1 ? first.promise : Promise.resolve("second-result");
      },
      publish: vi.fn(),
    });
    scheduler.accept({ payload: { image: "pixels-at-100ms" }, sourceTimestampMs: 100, observedAtMs: 10 });
    scheduler.accept({ payload: { image: "pixels-at-200ms" }, sourceTimestampMs: 200, observedAtMs: 20 });
    const liveVideoNow = { image: "pixels-at-300ms" };
    expect(liveVideoNow.image).toBe("pixels-at-300ms");
    first.resolve("first-result");
    await flush();
    expect(inferred[1]).toEqual({ image: "pixels-at-200ms", timestamp: 200 });
    expect(scheduler.snapshot()).toMatchObject({ activeInferenceCount: 1, pendingFrameCount: 0 });
  });
});
