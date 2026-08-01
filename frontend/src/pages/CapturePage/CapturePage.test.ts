import { describe, expect, it } from "vitest";
import { productStateUsesLiveCamera } from "./CapturePage";

describe("CapturePage camera-first layout", () => {
  it("keeps camera-first layout while Preparing has an active stream", () => {
    expect(productStateUsesLiveCamera("Preparing", true)).toBe(true);
    expect(productStateUsesLiveCamera("Preparing", false)).toBe(false);
  });

  it("keeps established live states camera-first", () => {
    expect(productStateUsesLiveCamera("Ready", false)).toBe(true);
    expect(productStateUsesLiveCamera("Countdown", false)).toBe(true);
    expect(productStateUsesLiveCamera("Recording", false)).toBe(true);
    expect(productStateUsesLiveCamera("Reviewing", true)).toBe(false);
  });
});
