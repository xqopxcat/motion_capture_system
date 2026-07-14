import type {
  CompareRecordRuntimeState,
  CompareRuntimeArtifact,
  CompareRuntimeIssue,
  CompareRuntimeIssueSeverity,
  PoseDataset,
  RecordDetail,
} from "../../types";

export function createCompareRuntimeIssue({
  artifact,
  debugMessage,
  message,
  severity,
}: {
  artifact: CompareRuntimeArtifact;
  debugMessage?: string;
  message: string;
  severity: CompareRuntimeIssueSeverity;
}): CompareRuntimeIssue {
  return {
    artifact,
    debugMessage,
    message,
    severity,
  };
}

export function hasBlockingCompareRuntimeIssue(runtime: CompareRecordRuntimeState) {
  return runtime.issues.some((issue) => issue.severity === "blocking");
}

export function getPrimaryCompareRuntimeMessage(runtime: CompareRecordRuntimeState) {
  return (
    runtime.issues.find((issue) => issue.severity === "blocking")?.message ??
    runtime.issues[0]?.message ??
    runtime.errorMessage
  );
}

function hasUsablePoseFrames(poseDataset: PoseDataset | null) {
  return Boolean(poseDataset && Array.isArray(poseDataset.frames) && poseDataset.frames.length > 0);
}

export function getBlockingCompareRuntimeIssues(issues: CompareRuntimeIssue[]) {
  return issues.filter((issue) => issue.severity === "blocking");
}

export function buildCompareRuntimeArtifactIssues({
  metricSeriesErrorMessage,
  poseDataset,
  poseErrorMessage,
  recordDetail,
}: {
  metricSeriesErrorMessage: string | null;
  poseDataset: PoseDataset | null;
  poseErrorMessage: string | null;
  recordDetail: RecordDetail;
}) {
  const issues: CompareRuntimeIssue[] = [];

  if (!recordDetail.video) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "video",
        message: "Ready Record is missing video metadata.",
        severity: "blocking",
      }),
    );
  } else if (!recordDetail.video.url) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "video",
        message: "Ready Record is missing a video URL.",
        severity: "blocking",
      }),
    );
  }

  if (!recordDetail.pose) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "pose",
        message: "Ready Record is missing Pose Dataset metadata.",
        severity: "blocking",
      }),
    );
  } else if (!recordDetail.pose.url) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "pose",
        message: "Ready Record is missing a Pose Dataset URL.",
        severity: "blocking",
      }),
    );
  }

  if (poseErrorMessage) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "pose",
        debugMessage: poseErrorMessage,
        message: "Pose Dataset could not be loaded or validated.",
        severity: "blocking",
      }),
    );
  }

  if (recordDetail.pose?.url && !poseErrorMessage && !hasUsablePoseFrames(poseDataset)) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "pose",
        message: "Pose Dataset has no renderable frames.",
        severity: "blocking",
      }),
    );
  }

  if (!recordDetail.metrics?.seriesUrl) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "metrics",
        message: "Metric Series is unavailable for this Record.",
        severity: "warning",
      }),
    );
  }

  if (metricSeriesErrorMessage) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "metrics",
        debugMessage: metricSeriesErrorMessage,
        message: "Metric Series could not be loaded.",
        severity: "warning",
      }),
    );
  }

  return issues;
}
