import { describe, expect, it } from "vitest";
import { nextPoseEngineTimestamp } from "./usePosePipeline";

describe("Pose engine timestamp clock", () => {
  it("remains strictly monotonic when a replacement camera stream restarts media time", () => {
    const beforeFlip = nextPoseEngineTimestamp(289_984_242, Number.NEGATIVE_INFINITY);
    const afterFlip = nextPoseEngineTimestamp(272_010, beforeFlip);

    expect(afterFlip).toBeGreaterThan(beforeFlip);
  });
});
