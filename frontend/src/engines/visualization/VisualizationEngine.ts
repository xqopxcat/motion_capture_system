import type { RenderContext } from "../../types";
import { clearVisualizationCanvas, renderSkeletonLayer } from "./renderSkeletonLayer";

export function renderVisualization(
  canvas: HTMLCanvasElement,
  renderContext: RenderContext,
) {
  const canvasContext = canvas.getContext("2d");

  if (!canvasContext) {
    return;
  }

  clearVisualizationCanvas(canvas, canvasContext);

  if (renderContext.mode === "skeleton") {
    renderSkeletonLayer(canvas, canvasContext, renderContext);
  }
}
