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

export type RenderContext = {
  canvasId: string;
  frameIndex: number;
  mode: VisualizationMode;
};

export type MetricDisplayValue = {
  id: string;
  label: string;
  value: string;
};

export type AnnotationDisplayItem = {
  id: string;
  frameIndex: number;
  title: string;
};
