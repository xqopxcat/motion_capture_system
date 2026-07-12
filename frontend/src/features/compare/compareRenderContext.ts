import { createViewerRenderContext } from "../viewer";
import type { PoseDataset, RenderContext } from "../../types";

export type CreateCompareRenderContextInput = {
  canvasId: string;
  frameIndex?: number;
  poseDataset: PoseDataset | null;
};

export function createCompareRenderContext({
  canvasId,
  frameIndex = 0,
  poseDataset,
}: CreateCompareRenderContextInput): RenderContext {
  return createViewerRenderContext({
    canvasId,
    currentFrame: frameIndex,
    poseDataset,
  });
}
