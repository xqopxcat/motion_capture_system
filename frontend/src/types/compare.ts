import type { PoseDataset } from "./poseDataset";
import type { RecordDetail } from "./record";
import type { RenderContext } from "./runtime";

export type CompareRouteSelection = {
  leftRecordId: string | null;
  rightRecordId: string | null;
};

export type CompareSelectionSide = "left" | "right";

export type CompareApiParams = {
  recordA: string;
  recordB: string;
};

export type CompareDataResponse = {
  recordA: RecordDetail;
  recordB: RecordDetail;
};

export type CompareRecordRuntimeStatus = "idle" | "loading" | "error" | "missing" | "ready";

export type CompareRuntimeArtifact = "record" | "video" | "pose" | "metrics" | "playback" | "unknown";

export type CompareRuntimeIssueSeverity = "blocking" | "warning";

export type CompareRuntimeIssue = {
  artifact: CompareRuntimeArtifact;
  debugMessage?: string;
  message: string;
  severity: CompareRuntimeIssueSeverity;
};

export type CompareRecordRuntimeState = {
  errorMessage: string | null;
  issues: CompareRuntimeIssue[];
  metricSeries: unknown | null;
  poseDataset: PoseDataset | null;
  recordDetail: RecordDetail | null;
  renderContext: RenderContext;
  retry: (() => void) | null;
  status: CompareRecordRuntimeStatus;
  videoSrc: string | null;
};
