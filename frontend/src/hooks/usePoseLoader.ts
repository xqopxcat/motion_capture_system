import { useEffect, useState } from "react";
import { validatePoseDatasetV1 } from "../features/capture/poseDatasetV1";
import { LOCAL_VIEWER_ARTIFACT_FIXTURE } from "../features/viewer/viewerArtifactFixtures";
import type { PoseDataset } from "../types";

type PoseLoaderState = {
  errorMessage: string | null;
  isPoseLoading: boolean;
  poseDataset: PoseDataset | null;
};

export function usePoseLoader(poseUrl?: string | null): PoseLoaderState {
  const [state, setState] = useState<PoseLoaderState>({
    errorMessage: null,
    isPoseLoading: false,
    poseDataset: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPoseDataset() {
      if (!poseUrl) {
        setState({
          errorMessage: null,
          isPoseLoading: false,
          poseDataset: null,
        });
        return;
      }

      setState({
        errorMessage: null,
        isPoseLoading: true,
        poseDataset: null,
      });

      try {
        const dataset = await loadPoseDatasetFromUrl(poseUrl);
        const validation = validatePoseDatasetV1(dataset);

        if (!validation.valid) {
          throw new Error(validation.errors.join(" "));
        }

        if (!cancelled) {
          setState({
            errorMessage: null,
            isPoseLoading: false,
            poseDataset: dataset,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            errorMessage: error instanceof Error ? error.message : "Pose Dataset could not load.",
            isPoseLoading: false,
            poseDataset: null,
          });
        }
      }
    }

    void loadPoseDataset();

    return () => {
      cancelled = true;
    };
  }, [poseUrl]);

  return state;
}

async function loadPoseDatasetFromUrl(poseUrl: string): Promise<PoseDataset> {
  if (isMockPoseDownloadUrl(poseUrl)) {
    return LOCAL_VIEWER_ARTIFACT_FIXTURE;
  }

  const response = await fetch(poseUrl);
  if (!response.ok) {
    throw new Error("Pose Dataset request failed.");
  }

  return (await response.json()) as PoseDataset;
}

function isMockPoseDownloadUrl(url: string) {
  return url.includes("mock-storage.local/download/") && url.includes("poses%2F");
}
