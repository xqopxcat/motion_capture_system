import type { MetricDisplayValue, PoseDataset } from "../../types";

export type ViewerArtifactStatus = "loading" | "error" | "missing" | "ready";

export type ViewerArtifactSource = {
  metrics: MetricDisplayValue[];
  poseDataset: PoseDataset | null;
  recordId: string;
  videoSrc: string | null;
};

export type ViewerArtifactLoaderState = ViewerArtifactSource & {
  errorMessage: string | null;
  status: ViewerArtifactStatus;
};

export type ResolveViewerArtifactSourceInput = {
  recordId?: string;
  searchParams?: URLSearchParams;
};
