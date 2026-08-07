import { describe, expect, it } from "vitest";
import { JOINT_ANGLE_REGISTRY } from "../../engines/motionModel";
import { CAPTURE_ANGLE_INTEGRATION_PROFILE } from "./captureAngleIntegrationProfile";

describe("Task 81 Capture angle integration profile", () => {
  it("uses every immutable registered metric in deterministic order with approved defaults", () => {
    expect(CAPTURE_ANGLE_INTEGRATION_PROFILE).toMatchObject({ skeletonDefaultVisible: true, anglesDefaultVisible: false });
    expect(CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds).toEqual(JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId));
    expect(Object.isFrozen(CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds)).toBe(true);
    expect(CAPTURE_ANGLE_INTEGRATION_PROFILE.selectedMetricIds.every((id) => JOINT_ANGLE_REGISTRY.some((item) => item.metricId === id))).toBe(true);
  });
});
