import { describe, expect, it } from "vitest";
import { JOINT_ANGLE_REGISTRY } from "../../engines/motionModel";
import { CAPTURE_ANGLE_INTEGRATION_PROFILE } from "./captureAngleIntegrationProfile";

describe("Task 81 Capture angle integration profile", () => {
  it("uses immutable knee metrics in deterministic order with approved defaults", () => {
    expect(CAPTURE_ANGLE_INTEGRATION_PROFILE).toMatchObject({ skeletonDefaultVisible: true, anglesDefaultVisible: false });
    expect(CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds).toEqual([
      "joint-angle.left-knee.internal.v1", "joint-angle.right-knee.internal.v1",
    ]);
    expect(Object.isFrozen(CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds)).toBe(true);
    expect(CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds.every((id) => JOINT_ANGLE_REGISTRY.some((item) => item.metricId === id))).toBe(true);
  });
});
