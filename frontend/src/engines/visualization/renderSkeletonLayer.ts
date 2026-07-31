import type { PoseDatasetLandmark, RenderContext } from "../../types";
import { PRODUCTION_SKELETON_PROFILE } from "./productionSkeletonProfile";
import {
  getProductionSkeletonDisplayScale,
  isProductionLandmarkRenderable,
  projectProductionSkeletonPoint,
  renderProductionSkeleton,
} from "./renderProductionSkeleton";

export type CanvasPoint = { x: number; y: number };

export function isRenderablePoseLandmark(
  landmark: PoseDatasetLandmark | undefined,
): landmark is PoseDatasetLandmark {
  return isProductionLandmarkRenderable(landmark);
}

export function getCanvasPoint(
  landmark: PoseDatasetLandmark,
  canvasWidth: number,
  canvasHeight: number,
): CanvasPoint {
  return { x: landmark.x * canvasWidth, y: landmark.y * canvasHeight };
}

export function clearVisualizationCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

export function getHighlightedJointIdSet(renderContext: RenderContext): Set<number> {
  return new Set([
    ...(renderContext.highlightedJointIds ?? []),
    ...(typeof renderContext.selectedJointId === "number" ? [renderContext.selectedJointId] : []),
  ].filter((jointId) => Number.isInteger(jointId) && jointId >= 0));
}

export function renderSkeletonLayer(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  renderContext: RenderContext,
) {
  const poseFrame = renderContext.poseFrame;
  if (!poseFrame || renderContext.mode === "none") return;

  renderProductionSkeleton(canvas, context, poseFrame, { clear: false });
  const landmarksById = new Map(poseFrame.landmarks2D.map((landmark) => [landmark.id, landmark]));
  const rect = typeof canvas.getBoundingClientRect === "function" ? canvas.getBoundingClientRect() : null;
  const cssWidth = rect?.width && rect.width > 0 ? rect.width : canvas.width;
  const dpr = cssWidth > 0 ? canvas.width / cssWidth : 1;
  const scale = getProductionSkeletonDisplayScale(cssWidth, dpr);

  getHighlightedJointIdSet(renderContext).forEach((jointId) => {
    const landmark = landmarksById.get(jointId);
    if (!isProductionLandmarkRenderable(landmark)) return;
    const point = projectProductionSkeletonPoint(canvas, landmark);
    context.save();
    context.globalAlpha = 1;
    context.lineWidth = Math.max(2 * scale.devicePixelRatio, scale.connectionWidth);
    context.strokeStyle = "#fbbf24";
    context.fillStyle = "rgba(251, 191, 36, 0.2)";
    context.setLineDash?.([]);
    context.beginPath();
    context.arc(point.x, point.y, scale.jointRadius * 2.2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  });
}

export { PRODUCTION_SKELETON_PROFILE };
