export type PoseEngineStatus = "idle" | "initializing" | "ready" | "detecting" | "disposed" | "error";

export type PoseDetectionSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap;

export type PoseDetectionInput = {
  source: PoseDetectionSource;
  timestampMs: number;
  frameIndex?: number;
};

export type PoseLandmark2D = {
  id: number;
  name: string;
  x: number;
  y: number;
  visibility?: number;
};

export type PoseLandmark3D = PoseLandmark2D & {
  z: number;
};

export type PoseDetectionResult = {
  engineName: string;
  engineVersion: string;
  timestampMs: number;
  frameIndex?: number;
  landmarks2D: PoseLandmark2D[];
  landmarks3D: PoseLandmark3D[];
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
