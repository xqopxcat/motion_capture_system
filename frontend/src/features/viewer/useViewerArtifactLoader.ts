import { useMemo } from "react";
import { resolveViewerArtifactSource } from "./resolveViewerArtifactSource";

export function useViewerArtifactLoader(recordId?: string, searchParams = new URLSearchParams()) {
  return useMemo(
    () =>
      resolveViewerArtifactSource({
        recordId,
        searchParams,
      }),
    [recordId, searchParams],
  );
}
