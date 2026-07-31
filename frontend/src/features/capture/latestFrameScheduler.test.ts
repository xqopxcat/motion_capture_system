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
});
