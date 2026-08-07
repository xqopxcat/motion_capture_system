import { JOINT_ANGLE_REGISTRY } from "../../engines/motionModel";

export const CAPTURE_ANGLE_INTEGRATION_PROFILE = Object.freeze({
  id: "capture-angle-integration.v1",
  version: "1.0.0",
  selectedMetricIds: Object.freeze(JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId)),
  skeletonDefaultVisible: true,
  anglesDefaultVisible: false,
});
