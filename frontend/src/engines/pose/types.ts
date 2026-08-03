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

declare const rawCanonicalPoseBrand: unique symbol;
declare const filteredRuntimePoseBrand: unique symbol;

export type RawCanonicalPose = Readonly<{
  readonly [rawCanonicalPoseBrand]: true;
  engineName: string;
  engineVersion: string;
  timestampMs: number;
  frameIndex?: number;
  cameraSessionId?: number;
  landmarks2D: readonly Readonly<PoseLandmark2D>[];
  landmarks3D: readonly Readonly<PoseLandmark3D>[];
}>;

export type FilteredRuntimePose = Readonly<{
  readonly [filteredRuntimePoseBrand]: true;
  engineName: string;
  engineVersion: string;
  timestampMs: number;
  frameIndex?: number;
  cameraSessionId?: number;
  runtimeProfileId: "runtime-visualization.stabilized.v1";
  landmarkQuality: readonly Readonly<{
    id: number;
    state: "filtered" | "held" | "outlier-rejected" | "unavailable";
    sourceTimestampMs: number;
  }>[];
  landmarkQuality3D: readonly Readonly<{
    id: number;
    state: "filtered" | "held" | "outlier-rejected" | "unavailable";
    sourceTimestampMs: number;
  }>[];
  qualityDiagnostics: Readonly<{
    filtered: number;
    held: number;
    outliers: number;
    unavailable: number;
  }>;
  landmarks2D: readonly (Readonly<PoseLandmark2D> | null)[];
  landmarks3D: readonly (Readonly<PoseLandmark3D> | null)[];
}>;

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
