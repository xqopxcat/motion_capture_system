import { useCallback, useState } from "react";

export function useCompareSyncController(initialSyncOffsetFrames = 0) {
  const [syncOffsetFrames, setSyncOffsetFrames] = useState(initialSyncOffsetFrames);

  const requestSyncOffset = useCallback((nextSyncOffsetFrames: number) => {
    // TODO: Sprint 1+ applies compare sync rules and validation here.
    setSyncOffsetFrames(nextSyncOffsetFrames);
  }, []);

  return {
    requestSyncOffset,
    syncOffsetFrames,
  };
}
