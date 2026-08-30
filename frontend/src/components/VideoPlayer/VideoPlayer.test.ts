import { describe, expect, it } from "vitest";
import { shouldReportMediaTime, videoNeedsPlaybackSync, videoNeedsSeek } from "./VideoPlayer";

describe("VideoPlayer frame seeking", () => {
  it("does not swallow a 30 fps next-frame seek", () => {
    expect(videoNeedsSeek(1, 1 + 1 / 30)).toBe(true);
  });

  it("rejects stale playback callbacks while a frame seek is pending", () => {
    expect(shouldReportMediaTime(5 / 30, 6 / 30)).toBe(false);
    expect(shouldReportMediaTime(6 / 30, 6 / 30)).toBe(true);
  });

  it("does not let paused video events overwrite explicit frame navigation", () => {
    expect(shouldReportMediaTime(5 / 30, 6 / 30, false)).toBe(false);
    expect(shouldReportMediaTime(6 / 30, 6 / 30, false)).toBe(false);
  });

  it("allows playback callbacks again after the paused seek is complete", () => {
    expect(shouldReportMediaTime(7 / 30, null, true)).toBe(true);
  });

  it("corrects material follower drift during synchronized playback", () => {
    expect(videoNeedsPlaybackSync(1, 1.2)).toBe(true);
    expect(videoNeedsPlaybackSync(1, 1.05)).toBe(false);
    expect(videoNeedsPlaybackSync(2, 1.8)).toBe(true);
  });
});
