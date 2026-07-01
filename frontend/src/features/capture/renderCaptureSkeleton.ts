import type { PoseDetectionResult, PoseLandmark2D } from "../../engines/pose";
import { CAPTURE_SKELETON_CONNECTIONS } from "./captureSkeletonConnections";

const MIN_VISIBLE_CONFIDENCE = 0.35;

function isRenderableLandmark(landmark: PoseLandmark2D | undefined) {
  if (!landmark) {
    return false;
  }

  return landmark.visibility === undefined || landmark.visibility >= MIN_VISIBLE_CONFIDENCE;
}

function getCanvasPoint(canvas: HTMLCanvasElement, landmark: PoseLandmark2D) {
  return {
    x: landmark.x * canvas.width,
    y: landmark.y * canvas.height,
  };
}

export function clearCaptureSkeleton(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

export function renderCaptureSkeleton(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  poseResult: PoseDetectionResult | null,
) {
  clearCaptureSkeleton(canvas, context);

  if (!poseResult) {
    return;
  }

  const landmarksById = new Map(poseResult.landmarks2D.map((landmark) => [landmark.id, landmark]));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 4;
  context.strokeStyle = "rgba(45, 212, 191, 0.9)";
  context.fillStyle = "rgba(255, 255, 255, 0.95)";

  CAPTURE_SKELETON_CONNECTIONS.forEach(([startId, endId]) => {
    const start = landmarksById.get(startId);
    const end = landmarksById.get(endId);

    if (!start || !end || !isRenderableLandmark(start) || !isRenderableLandmark(end)) {
      return;
    }

    const startPoint = getCanvasPoint(canvas, start);
    const endPoint = getCanvasPoint(canvas, end);

    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.stroke();
  });

  poseResult.landmarks2D.forEach((landmark) => {
    if (!isRenderableLandmark(landmark)) {
      return;
    }

    const point = getCanvasPoint(canvas, landmark);

    context.beginPath();
    context.arc(point.x, point.y, 5, 0, Math.PI * 2);
    context.fill();
  });

  context.restore();
}
