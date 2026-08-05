import type { SkeletonSide } from "./productionSkeletonProfile";

export type RuntimeAngleOverlayDisplayProfile = Readonly<{
  id: "angle-overlay.v1";
  maximumPoseAgeMs: number;
  viewportScale: Readonly<{ referenceWidthCssPx: number; minimum: number; maximum: number }>;
  arcRadius: Readonly<{ segmentRatio: number; minimumCssPx: number; maximumCssPx: number }>;
  arcWidth: Readonly<{ baseCssPx: number; minimumCssPx: number; maximumCssPx: number }>;
  label: Readonly<{ fontSizeCssPx: number; offsetCssPx: number; paddingXCssPx: number; paddingYCssPx: number; maximumAttempts: number }>;
  available: Readonly<{ arcOpacity: number; labelOpacity: number }>;
  degraded: Readonly<{ arcOpacity: number; labelOpacity: number; dashCssPx: readonly number[] }>;
  sideColors: Readonly<Record<SkeletonSide, string>>;
  labelTextColor: string;
  labelBackgroundColor: string;
}>;

export const RUNTIME_ANGLE_OVERLAY_PROFILE = Object.freeze({
  id: "angle-overlay.v1",
  maximumPoseAgeMs: 300,
  viewportScale: { referenceWidthCssPx: 720, minimum: 0.78, maximum: 1.45 },
  arcRadius: { segmentRatio: 0.28, minimumCssPx: 14, maximumCssPx: 42 },
  arcWidth: { baseCssPx: 3, minimumCssPx: 2, maximumCssPx: 5 },
  label: { fontSizeCssPx: 13, offsetCssPx: 10, paddingXCssPx: 5, paddingYCssPx: 3, maximumAttempts: 4 },
  available: { arcOpacity: 0.96, labelOpacity: 1 },
  degraded: { arcOpacity: 0.58, labelOpacity: 0.58, dashCssPx: [4, 3] },
  sideColors: { left: "#36c8b5", right: "#ffad66", center: "#f8fafc" },
  labelTextColor: "#f8fafc",
  labelBackgroundColor: "rgba(8, 15, 24, 0.78)",
} satisfies RuntimeAngleOverlayDisplayProfile);
