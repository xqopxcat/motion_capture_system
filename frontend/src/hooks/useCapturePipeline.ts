import { useState } from "react";
import type { CaptureRuntimeState } from "../types";

const initialCaptureRuntimeState: CaptureRuntimeState = {
  status: "idle",
};

export function useCapturePipeline() {
  const [captureState] = useState<CaptureRuntimeState>(initialCaptureRuntimeState);

  // TODO: Sprint 1+ owns camera permission, MediaRecorder, and pose pipeline orchestration here.
  return {
    captureState,
  };
}
