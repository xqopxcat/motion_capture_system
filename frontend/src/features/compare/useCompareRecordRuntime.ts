import { useMemo } from "react";
import { useMetricSeriesLoader, usePoseLoader } from "../../hooks";
import { useGetRecordDetailQuery } from "../../services/recordsApi";
import type { CompareRecordRuntimeState, CompareRuntimeIssue, PoseDataset } from "../../types";
import { createCompareRenderContext } from "./compareRenderContext";
import { createCompareRuntimeIssue } from "./compareRuntimeIssues";

function hasUsablePoseFrames(poseDataset: PoseDataset | null) {
  return Boolean(poseDataset && Array.isArray(poseDataset.frames) && poseDataset.frames.length > 0);
}

function getBlockingIssues(issues: CompareRuntimeIssue[]) {
  return issues.filter((issue) => issue.severity === "blocking");
}

export function useCompareRecordRuntime(
  recordId: string | null,
  canvasId: string,
): CompareRecordRuntimeState {
  const {
    data: recordDetail,
    isError: isRecordError,
    isLoading: isRecordLoading,
    refetch: retryRecordDetail,
  } = useGetRecordDetailQuery(recordId ?? "", {
    skip: !recordId,
  });
  const poseUrl = recordDetail?.status === "Ready" ? recordDetail.pose?.url : null;
  const metricSeriesUrl =
    recordDetail?.status === "Ready" ? recordDetail.metrics?.seriesUrl : null;
  const poseLoader = usePoseLoader(poseUrl);
  const metricSeriesLoader = useMetricSeriesLoader(metricSeriesUrl);
  const renderContext = useMemo(
    () =>
      createCompareRenderContext({
        canvasId,
        frameIndex: 0,
        poseDataset: poseLoader.poseDataset,
      }),
    [canvasId, poseLoader.poseDataset],
  );

  if (!recordId) {
    return {
      errorMessage: null,
      issues: [],
      metricSeries: null,
      poseDataset: null,
      recordDetail: null,
      renderContext,
      retry: null,
      status: "idle",
      videoSrc: null,
    };
  }

  if (isRecordLoading || poseLoader.isPoseLoading || metricSeriesLoader.isMetricSeriesLoading) {
    return {
      errorMessage: null,
      issues: [],
      metricSeries: metricSeriesLoader.metricSeries,
      poseDataset: poseLoader.poseDataset,
      recordDetail: recordDetail ?? null,
      renderContext,
      retry: retryRecordDetail,
      status: "loading",
      videoSrc: recordDetail?.video?.url ?? null,
    };
  }

  if (isRecordError || !recordDetail) {
    const issues = [
      createCompareRuntimeIssue({
        artifact: "record",
        message: "Record Detail could not be loaded.",
        severity: "blocking",
      }),
    ];

    return {
      errorMessage: issues[0].message,
      issues,
      metricSeries: null,
      poseDataset: null,
      recordDetail: null,
      renderContext,
      retry: retryRecordDetail,
      status: "error",
      videoSrc: null,
    };
  }

  if (recordDetail.status !== "Ready") {
    const issues = [
      createCompareRuntimeIssue({
        artifact: "record",
        message: `Record is ${recordDetail.status}. Compare requires Ready Records.`,
        severity: "blocking",
      }),
    ];

    return {
      errorMessage: issues[0].message,
      issues,
      metricSeries: null,
      poseDataset: null,
      recordDetail,
      renderContext,
      retry: retryRecordDetail,
      status: "missing",
      videoSrc: null,
    };
  }

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

  if (poseLoader.errorMessage) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "pose",
        debugMessage: poseLoader.errorMessage,
        message: "Pose Dataset could not be loaded or validated.",
        severity: "blocking",
      }),
    );
  }

  if (recordDetail.pose?.url && !poseLoader.errorMessage && !hasUsablePoseFrames(poseLoader.poseDataset)) {
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

  if (metricSeriesLoader.errorMessage) {
    issues.push(
      createCompareRuntimeIssue({
        artifact: "metrics",
        debugMessage: metricSeriesLoader.errorMessage,
        message: "Metric Series could not be loaded.",
        severity: "warning",
      }),
    );
  }

  const blockingIssues = getBlockingIssues(issues);

  if (blockingIssues.length > 0) {
    return {
      errorMessage: blockingIssues[0].message,
      issues,
      metricSeries: metricSeriesLoader.metricSeries,
      poseDataset: poseLoader.poseDataset,
      recordDetail,
      renderContext,
      retry: retryRecordDetail,
      status: "missing",
      videoSrc: recordDetail.video?.url ?? null,
    };
  }

  return {
    errorMessage: null,
    issues,
    metricSeries: metricSeriesLoader.metricSeries,
    poseDataset: poseLoader.poseDataset,
    recordDetail,
    renderContext,
    retry: retryRecordDetail,
    status: "ready",
    videoSrc: recordDetail.video?.url ?? null,
  };
}
