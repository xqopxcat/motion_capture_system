import type { JointAngleMetricId } from "../../engines/motionModel";

export const CAPTURE_ANGLE_INTEGRATION_PROFILE = Object.freeze({
  id: "capture-angle-integration.v1",
  selectedMetricIds: Object.freeze([
    "joint-angle.left-knee.internal.v1",
    "joint-angle.right-knee.internal.v1",
  ] as const satisfies readonly JointAngleMetricId[]),
  skeletonDefaultVisible: true,
  anglesDefaultVisible: false,
});
