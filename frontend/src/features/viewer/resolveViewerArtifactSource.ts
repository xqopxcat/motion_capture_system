import {
  LOCAL_VIEWER_ARTIFACT_FIXTURE,
  LOCAL_VIEWER_VIDEO_SRC,
} from "./viewerArtifactFixtures";
import type {
  ResolveViewerArtifactSourceInput,
  ViewerArtifactLoaderState,
} from "./viewerArtifactTypes";

const LOCAL_DEMO_RECORD_ID = "local-demo";

function createBaseState(recordId: string): ViewerArtifactLoaderState {
  return {
    errorMessage: null,
    metrics: [],
    poseDataset: null,
    recordId,
    status: "missing",
    videoSrc: null,
  };
}

export function resolveViewerArtifactSource({
  recordId,
  searchParams = new URLSearchParams(),
}: ResolveViewerArtifactSourceInput): ViewerArtifactLoaderState {
  if (!recordId) {
    return {
      ...createBaseState(""),
      errorMessage: "Viewer route is missing a record id.",
      status: "error",
    };
  }

  const source = createBaseState(recordId);
  const videoSrc = searchParams.get("videoUrl");
  const poseFixture = searchParams.get("poseFixture");
  const shouldUseLocalFixture = recordId === LOCAL_DEMO_RECORD_ID || poseFixture === LOCAL_DEMO_RECORD_ID;
  const resolvedPoseDataset = shouldUseLocalFixture ? LOCAL_VIEWER_ARTIFACT_FIXTURE : null;
  const resolvedVideoSrc = videoSrc || (shouldUseLocalFixture ? LOCAL_VIEWER_VIDEO_SRC : null);

  return {
    ...source,
    poseDataset: resolvedPoseDataset,
    status: resolvedPoseDataset && resolvedVideoSrc ? "ready" : "missing",
    videoSrc: resolvedVideoSrc,
  };
}
