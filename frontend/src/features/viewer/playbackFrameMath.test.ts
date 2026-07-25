import { describe, expect, it } from "vitest";
import {
  clampFrameIndex,
  clampTime,
  frameIndexToTime,
  frameTimestamp,
  timestampToFrameIndex,
  getMaxFrameIndex,
  timeToFrameIndex,
} from "./playbackFrameMath";

describe("playbackFrameMath", () => {
  it("converts time to a clamped frame index", () => {
    expect(timeToFrameIndex(1.2, 30, 100)).toBe(36);
    expect(timeToFrameIndex(9, 30, 10)).toBe(9);
  });

  it("converts frame index to time with frame clamping", () => {
    expect(frameIndexToTime(15, 30, 100)).toBe(0.5);
    expect(frameIndexToTime(999, 30, 10)).toBe(0.3);
  });

  it("clamps frame indexes to available bounds", () => {
    expect(getMaxFrameIndex(0)).toBe(0);
    expect(getMaxFrameIndex(3)).toBe(2);
    expect(clampFrameIndex(-4, 3)).toBe(0);
    expect(clampFrameIndex(10, 3)).toBe(2);
  });

  it("clamps time to media duration", () => {
    expect(clampTime(-1, 4)).toBe(0);
    expect(clampTime(5, 4)).toBe(4);
    expect(clampTime(Number.NaN, 4)).toBe(0);
  });

  it("selects the nearest irregularly-timed pose frame", () => {
    const timestamps = [0, 0.041, 0.115, 0.198];

    expect(timestampToFrameIndex(0.03, timestamps)).toBe(1);
    expect(timestampToFrameIndex(0.08, timestamps)).toBe(2);
    expect(timestampToFrameIndex(0.19, timestamps)).toBe(3);
    expect(frameTimestamp(2, timestamps)).toBe(0.115);
  });
});
