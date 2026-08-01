import {
  clearProductionSkeleton,
  renderProductionSkeleton,
} from "../../engines/visualization/renderProductionSkeleton";
import type {
  DisplayPoseSkeleton,
  SkeletonSourceViewport,
} from "../../engines/visualization/renderProductionSkeleton";

export type RenderablePoseSkeleton = DisplayPoseSkeleton;
export type CaptureSkeletonViewport = SkeletonSourceViewport;

export const clearCaptureSkeleton = clearProductionSkeleton;

export function renderCaptureSkeleton(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  poseResult: RenderablePoseSkeleton | null,
  viewport?: CaptureSkeletonViewport,
  poseAgeMs = 0,
  objectFit: "contain" | "cover" = "contain",
  clear = true,
) {
  renderProductionSkeleton(canvas, context, poseResult, {
    clear,
    poseAgeMs,
    sourceViewport: viewport,
    objectFit,
  });
}
