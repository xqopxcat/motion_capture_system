import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildPoseDatasetDraft,
  usePoseFrameCollection,
  usePosePipeline,
} from "../features/capture";
import type { CapturePoseDatasetDraft } from "../features/capture";
import type { CaptureRuntimeState } from "../types";
import { useCameraStream } from "./useCameraStream";
import { useMediaRecorder } from "./useMediaRecorder";

const initialCaptureRuntimeState: CaptureRuntimeState = {
  status: "idle",
};

function getCaptureTimestampMs(videoElement: HTMLVideoElement | null) {
  if (
    videoElement &&
    Number.isFinite(videoElement.currentTime) &&
    videoElement.currentTime > 0
  ) {
    return Math.floor(videoElement.currentTime * 1000);
  }

  return Math.floor(performance.now());
}

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
  const [previewVideoElement, setPreviewVideoElement] = useState<HTMLVideoElement | null>(null);
  const [poseDatasetDraft, setPoseDatasetDraft] = useState<CapturePoseDatasetDraft | null>(null);
  const wasRecordingRef = useRef(false);
  const cameraPreview = useCameraStream();
  const localRecording = useMediaRecorder(cameraPreview.stream);
  const posePipeline = usePosePipeline();
  const poseFrameCollection = usePoseFrameCollection();
  const { disposePosePipeline, initializePosePipeline, startPoseDetection, stopPoseDetection } =
    posePipeline;
  const { collectPoseFrame, getCollectedPoseFrames, startPoseFrameCollection, stopPoseFrameCollection } =
    poseFrameCollection;

  const isRecording = localRecording.status === "recording";
  const isStoppingRecording = localRecording.status === "stopping";
  const isCameraReady = cameraPreview.status === "ready";
  const hasRecordedPreview = Boolean(localRecording.recordedVideoUrl);

  const stopCameraPreview = useCallback(() => {
    localRecording.stopRecording();
    stopPoseDetection();
    disposePosePipeline();
    cameraPreview.stopCamera();
  }, [cameraPreview, disposePosePipeline, localRecording, stopPoseDetection]);

  useEffect(() => {
    if (cameraPreview.status === "ready") {
      void initializePosePipeline();
      return;
    }

    if (!cameraPreview.stream) {
      disposePosePipeline();
    }
  }, [cameraPreview.status, cameraPreview.stream, disposePosePipeline, initializePosePipeline]);

  useEffect(() => {
    if (
      cameraPreview.status === "ready" &&
      posePipeline.poseState.status === "ready" &&
      previewVideoElement
    ) {
      startPoseDetection(previewVideoElement);
      return;
    }

    if (cameraPreview.status !== "ready" || !previewVideoElement) {
      stopPoseDetection();
    }
  }, [
    cameraPreview.status,
    posePipeline.poseState.status,
    previewVideoElement,
    startPoseDetection,
    stopPoseDetection,
  ]);

  useEffect(() => {
    if (isRecording) {
      setPoseDatasetDraft(null);
      startPoseFrameCollection(getCaptureTimestampMs(previewVideoElement));
      wasRecordingRef.current = true;
      return;
    }

    stopPoseFrameCollection();

    if (wasRecordingRef.current) {
      setPoseDatasetDraft(buildPoseDatasetDraft(getCollectedPoseFrames()));
      wasRecordingRef.current = false;
    }
  }, [
    getCollectedPoseFrames,
    isRecording,
    previewVideoElement,
    startPoseFrameCollection,
    stopPoseFrameCollection,
  ]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    collectPoseFrame(posePipeline.currentPoseResult);
  }, [collectPoseFrame, isRecording, posePipeline.currentPoseResult]);

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
      onVideoElementChange: setPreviewVideoElement,
      stopCamera: stopCameraPreview,
    },
    currentPoseResult: posePipeline.currentPoseResult,
    localRecording,
    poseDatasetDraft,
    poseFrameCollection,
    previewVideoElement,
    posePipeline,
  };
}
