import { useState } from "react";
import type { CaptureRuntimeState } from "../types";
import { useCameraStream } from "./useCameraStream";

const initialCaptureRuntimeState: CaptureRuntimeState = {
  status: "idle",
};

export function useCapturePipeline() {
  const [captureState] = useState<CaptureRuntimeState>(initialCaptureRuntimeState);
  const cameraPreview = useCameraStream();

  return {
    captureState,
    cameraPreview,
  };
}
