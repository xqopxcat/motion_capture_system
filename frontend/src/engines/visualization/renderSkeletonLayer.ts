import type { PoseDatasetLandmark, RenderContext } from "../../types";
import { SKELETON_CONNECTIONS } from "./skeletonConnections";

const MIN_VISIBLE_CONFIDENCE = 0.35;
const HIGHLIGHT_RADIUS = 11;
const NORMAL_JOINT_RADIUS = 5;

export type CanvasPoint = {
  x: number;
  y: number;
};

export function isRenderablePoseLandmark(
  landmark: PoseDatasetLandmark | undefined,
): landmark is PoseDatasetLandmark {
  return Boolean(landmark && landmark.visibility >= MIN_VISIBLE_CONFIDENCE);
}

export function getCanvasPoint(
  landmark: PoseDatasetLandmark,
  canvasWidth: number,
  canvasHeight: number,
): CanvasPoint {
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight,
  };
}

export function clearVisualizationCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

export function getHighlightedJointIdSet(renderContext: RenderContext): Set<number> {
  const jointIds = [
    ...(renderContext.highlightedJointIds ?? []),
    ...(typeof renderContext.selectedJointId === "number" ? [renderContext.selectedJointId] : []),
  ];

  return new Set(
    jointIds.filter((jointId) => Number.isInteger(jointId) && jointId >= 0),
  );
}

export function renderSkeletonLayer(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  renderContext: RenderContext,
) {
  const poseFrame = renderContext.poseFrame;

  if (!poseFrame || renderContext.mode === "none") {
    return;
  }

  const landmarksById = new Map(poseFrame.landmarks2D.map((landmark) => [landmark.id, landmark]));
  const highlightedJointIds = getHighlightedJointIdSet(renderContext);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 4;
  context.strokeStyle = "rgba(45, 212, 191, 0.92)";
  context.fillStyle = "rgba(255, 255, 255, 0.96)";

  SKELETON_CONNECTIONS.forEach(([startId, endId]) => {
    const start = landmarksById.get(startId);
    const end = landmarksById.get(endId);

    if (!isRenderablePoseLandmark(start) || !isRenderablePoseLandmark(end)) {
      return;
    }

    const startPoint = getCanvasPoint(start, canvas.width, canvas.height);
    const endPoint = getCanvasPoint(end, canvas.width, canvas.height);

    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.stroke();
  });

  poseFrame.landmarks2D.forEach((landmark) => {
    if (!isRenderablePoseLandmark(landmark)) {
      return;
    }

    const point = getCanvasPoint(landmark, canvas.width, canvas.height);

    context.beginPath();
    context.arc(point.x, point.y, NORMAL_JOINT_RADIUS, 0, Math.PI * 2);
    context.fill();
  });

  highlightedJointIds.forEach((jointId) => {
    const landmark = landmarksById.get(jointId);

    if (!isRenderablePoseLandmark(landmark)) {
      return;
    }

    const point = getCanvasPoint(landmark, canvas.width, canvas.height);

    context.save();
    context.lineWidth = 4;
    context.strokeStyle = "#f59e0b";
    context.fillStyle = "rgba(245, 158, 11, 0.22)";
    context.beginPath();
    context.arc(point.x, point.y, HIGHLIGHT_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  });

  context.restore();
}
