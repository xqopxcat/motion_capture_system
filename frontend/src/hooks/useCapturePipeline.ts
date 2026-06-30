import { useCallback, useState } from "react";
import { usePosePipeline } from "../features/capture";
import type { CaptureRuntimeState } from "../types";
import { useCameraStream } from "./useCameraStream";
import { useMediaRecorder } from "./useMediaRecorder";

const initialCaptureRuntimeState: CaptureRuntimeState = {
  status: "idle",
};

function getPrimaryStatusText(
  cameraStatus: ReturnType<typeof useCameraStream>["status"],
  recordingStatus: ReturnType<typeof useMediaRecorder>["status"],
) {
  if (recordingStatus === "recording") {
    return "Recording in browser";
  }

  if (recordingStatus === "stopping") {
    return "Finishing local recording";
  }

  if (recordingStatus === "recorded") {
    return "Recording ready for review";
  }

  if (recordingStatus === "unsupported") {
    return "Local recording is not supported in this browser";
  }

  if (recordingStatus === "error") {
    return "Local recording needs attention";
  }

  if (cameraStatus === "ready") {
    return "Ready to record";
  }

  if (cameraStatus === "requesting") {
    return "Waiting for camera permission";
  }

  return "Ready after camera preview starts";
}

export function useCapturePipeline() {
  const [captureState] = useState<CaptureRuntimeState>(initialCaptureRuntimeState);
  const cameraPreview = useCameraStream();
  const localRecording = useMediaRecorder(cameraPreview.stream);
  const posePipeline = usePosePipeline();

  const isRecording = localRecording.status === "recording";
  const isStoppingRecording = localRecording.status === "stopping";
  const isCameraReady = cameraPreview.status === "ready";
  const hasRecordedPreview = Boolean(localRecording.recordedVideoUrl);

  const stopCameraPreview = useCallback(() => {
    localRecording.stopRecording();
    cameraPreview.stopCamera();
  }, [cameraPreview, localRecording]);

  const canStartRecording = isCameraReady && !isRecording && !isStoppingRecording;
  const canStopRecording = isRecording || isStoppingRecording;

  const captureViewState = {
    canStartCamera: cameraPreview.status !== "requesting",
    canStopCamera: Boolean(cameraPreview.stream) || cameraPreview.status === "requesting",
    canStartRecording,
    canStopRecording,
    hasRecordedPreview,
    isCameraReady,
    isRecording,
    isStoppingRecording,
    primaryStatusText: getPrimaryStatusText(cameraPreview.status, localRecording.status),
  };

  return {
    captureState,
    captureViewState,
    cameraPreview: {
      ...cameraPreview,
      stopCamera: stopCameraPreview,
    },
    localRecording,
    posePipeline,
  };
}
