import { useCallback, useMemo, useState } from "react";
import { createPoseEngine } from "../../engines/pose";
import type { PoseEngine, PoseEngineStatus } from "../../engines/pose";

export type CapturePosePipelineState = {
  status: PoseEngineStatus;
  engineName: string;
  errorMessage: string | null;
};

const initialPosePipelineState: CapturePosePipelineState = {
  status: "idle",
  engineName: "noop-pose-engine",
  errorMessage: null,
};

export function usePosePipeline() {
  const poseEngine = useMemo<PoseEngine>(() => createPoseEngine("noop"), []);
  const [poseState, setPoseState] = useState<CapturePosePipelineState>({
    ...initialPosePipelineState,
    engineName: poseEngine.metadata.name,
  });

  const initializePosePipeline = useCallback(async () => {
    setPoseState((currentState) => ({
      ...currentState,
      status: "initializing",
      errorMessage: null,
    }));

    try {
      await poseEngine.initialize();
      setPoseState((currentState) => ({
        ...currentState,
        status: "ready",
      }));
    } catch (error) {
      setPoseState((currentState) => ({
        ...currentState,
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Pose pipeline could not be initialized.",
      }));
    }
  }, [poseEngine]);

  const disposePosePipeline = useCallback(() => {
    poseEngine.dispose();
    setPoseState((currentState) => ({
      ...currentState,
      status: "disposed",
    }));
  }, [poseEngine]);

  return {
    poseState,
    initializePosePipeline,
    disposePosePipeline,
  };
}
