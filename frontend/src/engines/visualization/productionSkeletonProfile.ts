export type SkeletonSide = "left" | "right" | "center";
export type SkeletonConnection = readonly [number, number];

export type SkeletonSideStyle = Readonly<{
  color: string;
  dash: readonly number[];
  jointShape: "circle" | "square" | "ring";
}>;

export type ProductionSkeletonDisplayProfile = Readonly<{
  id: "production-display.v1";
  visibleLandmarkIndexes: ReadonlySet<number>;
  visibleConnections: readonly SkeletonConnection[];
  highConfidenceThreshold: number;
  minimumVisibilityThreshold: number;
  minimumPresenceThreshold: number;
  activeOpacity: number;
  mediumConfidenceOpacity: number;
  missingPoseBehavior: "clear";
  stalePoseBehavior: "clear";
  maximumPoseAgeMs: number;
  coordinateBounds: Readonly<{ minimum: number; maximum: number }>;
  landmarkRadius: Readonly<{ baseCssPx: number; minimumCssPx: number; maximumCssPx: number }>;
  connectionWidth: Readonly<{ baseCssPx: number; minimumCssPx: number; maximumCssPx: number }>;
  centerOutline: Readonly<{ color: string; extraWidthCssPx: number }>;
  viewportScale: Readonly<{ referenceWidthCssPx: number; minimum: number; maximum: number }>;
  sideStyles: Readonly<Record<SkeletonSide, SkeletonSideStyle>>;
}>;

export const PRODUCTION_SKELETON_LANDMARK_INDEXES = Object.freeze([
  0,
  11, 12, 13, 14, 15, 16, 19, 20,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
] as const);

export const PRODUCTION_SKELETON_CONNECTIONS: readonly SkeletonConnection[] = Object.freeze([
  [11, 12],
  [11, 13], [13, 15], [15, 19],
  [12, 14], [14, 16], [16, 20],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
] as const);

const LEFT_LANDMARKS = new Set([11, 13, 15, 19, 23, 25, 27, 29, 31]);
const RIGHT_LANDMARKS = new Set([12, 14, 16, 20, 24, 26, 28, 30, 32]);

export function classifyProductionLandmarkSide(landmarkId: number): SkeletonSide {
  if (LEFT_LANDMARKS.has(landmarkId)) return "left";
  if (RIGHT_LANDMARKS.has(landmarkId)) return "right";
  return "center";
}

export function classifyProductionConnectionSide([startId, endId]: SkeletonConnection): SkeletonSide {
  const start = classifyProductionLandmarkSide(startId);
  const end = classifyProductionLandmarkSide(endId);
  return start === end ? start : "center";
}

export const PRODUCTION_SKELETON_PROFILE = Object.freeze({
  id: "production-display.v1",
  visibleLandmarkIndexes: new Set(PRODUCTION_SKELETON_LANDMARK_INDEXES),
  visibleConnections: PRODUCTION_SKELETON_CONNECTIONS,
  highConfidenceThreshold: 0.65,
  minimumVisibilityThreshold: 0.35,
  minimumPresenceThreshold: 0.35,
  activeOpacity: 0.96,
  mediumConfidenceOpacity: 0.52,
  missingPoseBehavior: "clear",
  stalePoseBehavior: "clear",
  maximumPoseAgeMs: 300,
  coordinateBounds: { minimum: -0.2, maximum: 1.2 },
  landmarkRadius: { baseCssPx: 4.5, minimumCssPx: 3, maximumCssPx: 7 },
  connectionWidth: { baseCssPx: 3, minimumCssPx: 2, maximumCssPx: 5 },
  centerOutline: { color: "rgba(8, 15, 24, 0.78)", extraWidthCssPx: 2 },
  viewportScale: { referenceWidthCssPx: 720, minimum: 0.78, maximum: 1.45 },
  sideStyles: {
    left: { color: "#36c8b5", dash: [], jointShape: "circle" },
    right: { color: "#ffad66", dash: [5, 4], jointShape: "square" },
    center: { color: "#f8fafc", dash: [], jointShape: "ring" },
  },
} satisfies ProductionSkeletonDisplayProfile);
