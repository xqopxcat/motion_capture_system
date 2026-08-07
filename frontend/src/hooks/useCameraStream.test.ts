import { describe, expect, it } from "vitest";
import { CAMERA_FRAME_RATE_CONSTRAINT } from "./useCameraStream";

describe("camera acquisition constraints", () => {
  it("requests 30 FPS as advisory ideal without a hard minimum or exact value", () => {
    expect(CAMERA_FRAME_RATE_CONSTRAINT).toEqual({ ideal: 30 });
    expect(CAMERA_FRAME_RATE_CONSTRAINT).not.toHaveProperty("min");
    expect(CAMERA_FRAME_RATE_CONSTRAINT).not.toHaveProperty("exact");
    expect(Object.isFrozen(CAMERA_FRAME_RATE_CONSTRAINT)).toBe(true);
  });
});
