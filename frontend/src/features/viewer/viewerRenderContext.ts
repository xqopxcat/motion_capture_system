import type { PoseDataset, PoseDatasetFrame, RenderContext } from "../../types";
import { clampFrameIndex } from "./playbackFrameMath";

export type CreateViewerRenderContextInput = {
  canvasId: string;
  currentFrame: number;
  poseDataset: PoseDataset | null;
};

export function selectPoseFrameByIndex(
  poseDataset: PoseDataset | null,
  currentFrame: number,
): PoseDatasetFrame | null {
  if (!poseDataset || poseDataset.frames.length === 0) {
    return null;
  }

  const clampedFrameIndex = clampFrameIndex(currentFrame, poseDataset.frames.length);

  return poseDataset.frames[clampedFrameIndex] ?? null;
}

export function createViewerRenderContext({
  canvasId,
  currentFrame,
  poseDataset,
}: CreateViewerRenderContextInput): RenderContext {
  const poseFrame = selectPoseFrameByIndex(poseDataset, currentFrame);

  return {
    annotations: [],
    canvasId,
    frameIndex: poseFrame?.frameIndex ?? clampFrameIndex(currentFrame, poseDataset?.frames.length ?? 0),
    metrics: [],
    mode: "skeleton",
    poseFrame,
  };
}
