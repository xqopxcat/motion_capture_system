import type { PoseEngine } from "./PoseEngine";
import { createNoopPoseEngine } from "./noopPoseEngine";

export type PoseEngineKind = "noop";

export function createPoseEngine(kind: PoseEngineKind = "noop"): PoseEngine {
  if (kind === "noop") {
    return createNoopPoseEngine();
  }

  return createNoopPoseEngine();
}
