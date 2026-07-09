import type { PoseDatasetFrame } from "./poseDataset";

export type VisualizationMode = "none" | "skeleton" | "metrics" | "annotations";

export type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
};

export type FrameState = {
  currentFrame: number;
  totalFrames: number;
  fps: number;
};

export type CaptureRuntimeState = {
  status: "idle" | "recording" | "analyzing" | "uploading" | "completed" | "failed";
};

export type UploadRuntimeState = {
  status: "idle" | "requesting" | "uploading" | "completed" | "failed";
  progress: number;
};

export type ViewerRuntimeState = {
  playback: PlaybackState;
  frame: FrameState;
  visualizationMode: VisualizationMode;
};

export type CompareRuntimeState = {
  leftRecordId: string | null;
  rightRecordId: string | null;
  syncOffsetFrames: number;
  playback: PlaybackState;
  frame: FrameState;
};

export type MetricDisplayValue = {
  id: string;
  label: string;
  value: string;
};

export type AnnotationMarker = {
  annotationId: string;
  frameIndex: number;
  note?: string;
  timestamp?: number;
  title: string;
};

export type AnnotationDisplayItem = AnnotationMarker & {
  id: string;
};

export type RenderContext = {
  annotations?: AnnotationMarker[];
  canvasId: string;
  canvasSize?: {
    height: number;
    width: number;
  };
  frameIndex: number;
  metrics?: MetricDisplayValue[];
  mode: VisualizationMode;
  poseFrame?: PoseDatasetFrame | null;
  selectedJointId?: number;
};
