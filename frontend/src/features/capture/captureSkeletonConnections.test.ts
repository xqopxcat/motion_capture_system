import { describe, expect, it } from "vitest";
import { CAPTURE_SKELETON_CONNECTIONS } from "./captureSkeletonConnections";
import { PRODUCTION_SKELETON_CONNECTIONS } from "../../engines/visualization";

const PLATFORM_POSE_LANDMARK_COUNT = 33;

describe("capture skeleton connections", () => {
  it("uses platform pose landmark ids", () => {
    CAPTURE_SKELETON_CONNECTIONS.forEach(([startId, endId]) => {
      expect(startId).toBeGreaterThanOrEqual(0);
      expect(startId).toBeLessThan(PLATFORM_POSE_LANDMARK_COUNT);
      expect(endId).toBeGreaterThanOrEqual(0);
      expect(endId).toBeLessThan(PLATFORM_POSE_LANDMARK_COUNT);
    });
  });

  it("uses the same stable profile as Viewer and Compare", () => {
    expect(CAPTURE_SKELETON_CONNECTIONS).toBe(PRODUCTION_SKELETON_CONNECTIONS);
  });
});
