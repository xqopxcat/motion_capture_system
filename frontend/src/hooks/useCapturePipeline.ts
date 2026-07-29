import { captureRuntimeInstrumentation } from "../features/capture/instrumentation/captureRuntimeInstrumentation";
import { useCaptureController } from "../features/capture/useCaptureController";

export function useCapturePipeline() {
  captureRuntimeInstrumentation.recordReactRender("useCapturePipeline");
  return useCaptureController();
}
