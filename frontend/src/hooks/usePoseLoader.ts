export function usePoseLoader() {
  // TODO: Sprint 1+ loads Pose Dataset into hook or engine memory, never Redux.
  return {
    poseDataset: null,
    isPoseLoading: false,
  } as const;
}
