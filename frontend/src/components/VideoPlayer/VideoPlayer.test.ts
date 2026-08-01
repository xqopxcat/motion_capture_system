import { describe, expect, it } from "vitest";
import { shouldReportMediaTime, videoNeedsSeek } from "./VideoPlayer";

describe("VideoPlayer frame seeking", () => {
  it("does not swallow a 30 fps next-frame seek", () => {
    expect(videoNeedsSeek(1, 1 + 1 / 30)).toBe(true);
  });

  it("rejects stale playback callbacks while a frame seek is pending", () => {
    expect(shouldReportMediaTime(5 / 30, 6 / 30)).toBe(false);
    expect(shouldReportMediaTime(6 / 30, 6 / 30)).toBe(true);
  });
});
