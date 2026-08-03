import {
  classifyProductionConnectionSide,
  classifyProductionLandmarkSide,
  PRODUCTION_SKELETON_PROFILE,
} from "./productionSkeletonProfile";
import type {
  ProductionSkeletonDisplayProfile,
  SkeletonSide,
} from "./productionSkeletonProfile";

export type DisplayPoseLandmark = {
  id: number;
  x: number;
  y: number;
  visibility?: number;
  presence?: number;
};

export type DisplayPoseSkeleton = { landmarks2D: readonly DisplayPoseLandmark[] };
export type SkeletonSourceViewport = { sourceWidth: number; sourceHeight: number };
export type SkeletonObjectFit = "contain" | "cover";

export type ProductionSkeletonRenderOptions = {
  clear?: boolean;
  mirror?: boolean;
  poseAgeMs?: number;
  profile?: ProductionSkeletonDisplayProfile;
  sourceViewport?: SkeletonSourceViewport;
  objectFit?: SkeletonObjectFit;
};

export type SkeletonDisplayScale = {
  connectionWidth: number;
  devicePixelRatio: number;
  jointRadius: number;
  viewportScale: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getProductionSkeletonDisplayScale(
  cssWidth: number,
  devicePixelRatio: number,
  profile: ProductionSkeletonDisplayProfile = PRODUCTION_SKELETON_PROFILE,
): SkeletonDisplayScale {
  const safeCssWidth = Number.isFinite(cssWidth) && cssWidth > 0
    ? cssWidth
    : profile.viewportScale.referenceWidthCssPx;
  const safeDpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? devicePixelRatio
    : 1;
  const viewportScale = clamp(
    safeCssWidth / profile.viewportScale.referenceWidthCssPx,
    profile.viewportScale.minimum,
    profile.viewportScale.maximum,
  );
  const radiusCss = clamp(
    profile.landmarkRadius.baseCssPx * viewportScale,
    profile.landmarkRadius.minimumCssPx,
    profile.landmarkRadius.maximumCssPx,
  );
  const widthCss = clamp(
    profile.connectionWidth.baseCssPx * viewportScale,
    profile.connectionWidth.minimumCssPx,
    profile.connectionWidth.maximumCssPx,
  );
  return {
    connectionWidth: widthCss * safeDpr,
    devicePixelRatio: safeDpr,
    jointRadius: radiusCss * safeDpr,
    viewportScale,
  };
}

export function getProductionLandmarkOpacity(
  landmark: DisplayPoseLandmark | undefined,
  profile: ProductionSkeletonDisplayProfile = PRODUCTION_SKELETON_PROFILE,
): number | null {
  if (!landmark || !profile.visibleLandmarkIndexes.has(landmark.id)) return null;
  if (![landmark.x, landmark.y].every(Number.isFinite)) return null;
  if (
    landmark.x < profile.coordinateBounds.minimum || landmark.x > profile.coordinateBounds.maximum ||
    landmark.y < profile.coordinateBounds.minimum || landmark.y > profile.coordinateBounds.maximum
  ) return null;
  const visibility = landmark.visibility ?? 1;
  const presence = landmark.presence ?? 1;
  if (!Number.isFinite(visibility) || !Number.isFinite(presence)) return null;
  if (visibility < profile.minimumVisibilityThreshold || presence < profile.minimumPresenceThreshold) {
    return null;
  }
  return Math.min(visibility, presence) < profile.highConfidenceThreshold
    ? profile.mediumConfidenceOpacity
    : profile.activeOpacity;
}

export function isProductionLandmarkRenderable(
  landmark: DisplayPoseLandmark | undefined,
  profile: ProductionSkeletonDisplayProfile = PRODUCTION_SKELETON_PROFILE,
): landmark is DisplayPoseLandmark {
  return getProductionLandmarkOpacity(landmark, profile) !== null;
}

export function projectProductionSkeletonPoint(
  canvas: HTMLCanvasElement,
  landmark: DisplayPoseLandmark,
  options: Pick<ProductionSkeletonRenderOptions, "mirror" | "objectFit" | "sourceViewport"> = {},
) {
  const normalizedX = options.mirror ? 1 - landmark.x : landmark.x;
  const viewport = options.sourceViewport;
  if (viewport && viewport.sourceWidth > 0 && viewport.sourceHeight > 0) {
    const scale = (options.objectFit ?? "cover") === "contain"
      ? Math.min(canvas.width / viewport.sourceWidth, canvas.height / viewport.sourceHeight)
      : Math.max(canvas.width / viewport.sourceWidth, canvas.height / viewport.sourceHeight);
    const renderedWidth = viewport.sourceWidth * scale;
    const renderedHeight = viewport.sourceHeight * scale;
    return {
      x: normalizedX * renderedWidth + (canvas.width - renderedWidth) / 2,
      y: landmark.y * renderedHeight + (canvas.height - renderedHeight) / 2,
    };
  }
  return { x: normalizedX * canvas.width, y: landmark.y * canvas.height };
}

export function clearProductionSkeleton(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

export function syncProductionCanvasSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  const changed = canvas.width !== width || canvas.height !== height;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  return { changed, cssHeight: rect.height, cssWidth: rect.width, devicePixelRatio: dpr, height, width };
}

function canvasDisplayScale(canvas: HTMLCanvasElement, profile: ProductionSkeletonDisplayProfile) {
  const rect = typeof canvas.getBoundingClientRect === "function"
    ? canvas.getBoundingClientRect()
    : null;
  const cssWidth = rect?.width && rect.width > 0 ? rect.width : canvas.width;
  const dpr = cssWidth > 0 ? canvas.width / cssWidth : 1;
  return getProductionSkeletonDisplayScale(cssWidth, dpr, profile);
}

function applySideStyle(
  context: CanvasRenderingContext2D,
  side: SkeletonSide,
  profile: ProductionSkeletonDisplayProfile,
) {
  const style = profile.sideStyles[side];
  context.strokeStyle = style.color;
  context.fillStyle = style.color;
  context.setLineDash?.([...style.dash]);
  return style;
}

export function renderProductionSkeleton(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  pose: DisplayPoseSkeleton | null,
  options: ProductionSkeletonRenderOptions = {},
) {
  const profile = options.profile ?? PRODUCTION_SKELETON_PROFILE;
  if (options.clear !== false) clearProductionSkeleton(canvas, context);
  if (!pose || (options.poseAgeMs ?? 0) > profile.maximumPoseAgeMs) return;

  const landmarksById = new Map(pose.landmarks2D.map((landmark) => [landmark.id, landmark]));
  const scale = canvasDisplayScale(canvas, profile);
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = scale.connectionWidth;

  profile.visibleConnections.forEach((connection) => {
    const start = landmarksById.get(connection[0]);
    const end = landmarksById.get(connection[1]);
    const startOpacity = getProductionLandmarkOpacity(start, profile);
    const endOpacity = getProductionLandmarkOpacity(end, profile);
    if (startOpacity === null || endOpacity === null || !start || !end) return;
    const startPoint = projectProductionSkeletonPoint(canvas, start, options);
    const endPoint = projectProductionSkeletonPoint(canvas, end, options);
    const side = classifyProductionConnectionSide(connection);
    applySideStyle(context, side, profile);
    context.globalAlpha = Math.min(startOpacity, endOpacity);
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    if (side === "center") {
      context.strokeStyle = profile.centerOutline.color;
      context.lineWidth = scale.connectionWidth + profile.centerOutline.extraWidthCssPx * scale.devicePixelRatio;
      context.stroke();
      context.strokeStyle = profile.sideStyles.center.color;
      context.lineWidth = scale.connectionWidth;
    }
    context.stroke();
  });

  profile.visibleLandmarkIndexes.forEach((landmarkId) => {
    const landmark = landmarksById.get(landmarkId);
    const opacity = getProductionLandmarkOpacity(landmark, profile);
    if (opacity === null || !landmark) return;
    const point = projectProductionSkeletonPoint(canvas, landmark, options);
    const side = classifyProductionLandmarkSide(landmarkId);
    const style = applySideStyle(context, side, profile);
    context.globalAlpha = opacity;
    context.beginPath();
    if (style.jointShape === "square") {
      context.fillRect(
        point.x - scale.jointRadius,
        point.y - scale.jointRadius,
        scale.jointRadius * 2,
        scale.jointRadius * 2,
      );
    } else {
      context.arc(point.x, point.y, scale.jointRadius, 0, Math.PI * 2);
      if (style.jointShape === "ring") {
        context.strokeStyle = profile.centerOutline.color;
        context.lineWidth = scale.connectionWidth + profile.centerOutline.extraWidthCssPx * scale.devicePixelRatio;
        context.stroke();
        context.strokeStyle = style.color;
        context.lineWidth = Math.max(scale.devicePixelRatio * 2, scale.connectionWidth * 0.75);
        context.stroke();
        context.lineWidth = scale.connectionWidth;
      } else {
        context.fill();
      }
    }
  });
  context.restore();
}
