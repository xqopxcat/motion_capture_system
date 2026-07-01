export type PoseEngineStatus = "idle" | "initializing" | "ready" | "detecting" | "disposed" | "error";

export type PoseDetectionSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap;

export type PoseDetectionInput = {
  source: PoseDetectionSource;
  timestampMs: number;
};

export type PoseLandmark = {
  jointId: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PoseDetectionResult = {
  engineName: string;
  engineVersion: string;
  timestampMs: number;
  landmarks: PoseLandmark[];
};

export type PoseOutputSchema = "pose.v1";

export type PoseAdapterCapabilities = {
  supports2D: boolean;
  supports3D: boolean;
  supportsRealtime: boolean;
  supportsVideoFrame: boolean;
  supportsVisibility: boolean;
  jointCount: number;
  outputSchema: PoseOutputSchema;
};

export type PoseEngineMetadata = {
  name: string;
  version: string;
  capabilities: PoseAdapterCapabilities;
};
