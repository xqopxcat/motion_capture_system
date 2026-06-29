import { useState } from "react";
import type { UploadRuntimeState } from "../types";

const initialUploadRuntimeState: UploadRuntimeState = {
  status: "idle",
  progress: 0,
};

export function useRecordUploadPipeline() {
  const [uploadState] = useState<UploadRuntimeState>(initialUploadRuntimeState);

  // TODO: Sprint 1+ coordinates signed URL requests through RTK Query services.
  return {
    uploadState,
  };
}
