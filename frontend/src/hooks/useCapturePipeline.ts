import { useCallback, useState } from "react";
import type { CaptureRuntimeState } from "../types";
import { useCameraStream } from "./useCameraStream";
import { useMediaRecorder } from "./useMediaRecorder";

const initialCaptureRuntimeState: CaptureRuntimeState = {
  status: "idle",
};

export function useCapturePipeline() {
  const [captureState] = useState<CaptureRuntimeState>(initialCaptureRuntimeState);
  const cameraPreview = useCameraStream();
  const localRecording = useMediaRecorder(cameraPreview.stream);

  const stopCameraPreview = useCallback(() => {
    localRecording.stopRecording();
    cameraPreview.stopCamera();
  }, [cameraPreview, localRecording]);

  const canRecord = cameraPreview.status === "ready" && localRecording.status !== "recording";

  return {
    captureState,
    cameraPreview: {
      ...cameraPreview,
      stopCamera: stopCameraPreview,
    },
    localRecording: {
      ...localRecording,
      canRecord,
    },
  };
}
