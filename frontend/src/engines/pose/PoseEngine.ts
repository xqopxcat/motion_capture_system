import type { PoseDetectionInput, PoseDetectionResult, PoseEngineMetadata } from "./types";

export interface PoseEngine {
  readonly metadata: PoseEngineMetadata;
  initialize(): Promise<void>;
  detect(input: PoseDetectionInput): Promise<PoseDetectionResult>;
  dispose(): void;
}
