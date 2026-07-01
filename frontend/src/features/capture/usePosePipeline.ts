import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPoseEngine } from "../../engines/pose/createPoseEngine";
import type { PoseEngine } from "../../engines/pose/PoseEngine";
import type { PoseEngineStatus } from "../../engines/pose/types";

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
  const isMountedRef = useRef(true);
  const statusRef = useRef<PoseEngineStatus>("idle");

  const initializePosePipeline = useCallback(async () => {
    if (statusRef.current === "initializing" || statusRef.current === "ready") {
      return;
    }

    statusRef.current = "initializing";
    setPoseState((currentState) => {
      return {
        ...currentState,
        status: "initializing",
        errorMessage: null,
      };
    });

    try {
      await poseEngine.initialize();

      if (!isMountedRef.current) {
        poseEngine.dispose();
        return;
      }

      statusRef.current = "ready";
      setPoseState((currentState) => ({
        ...currentState,
        status: "ready",
        errorMessage: null,
      }));
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      statusRef.current = "error";
      setPoseState((currentState) => ({
        ...currentState,
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Pose pipeline could not be initialized.",
      }));
    }
  }, [poseEngine]);

  const disposePosePipeline = useCallback(() => {
    if (statusRef.current === "idle" || statusRef.current === "disposed") {
      return;
    }

    poseEngine.dispose();
    statusRef.current = "disposed";
    setPoseState((currentState) => {
      return {
        ...currentState,
        status: "disposed",
      };
    });
  }, [poseEngine]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      poseEngine.dispose();
      statusRef.current = "disposed";
    };
  }, [poseEngine]);

  return {
    poseState,
    initializePosePipeline,
    disposePosePipeline,
  };
}
