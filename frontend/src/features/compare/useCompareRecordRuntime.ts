import { useMemo } from "react";
import { useMetricSeriesLoader, usePoseLoader } from "../../hooks";
import { useGetRecordDetailQuery } from "../../services/recordsApi";
import type { CompareRecordRuntimeState } from "../../types";
import { createCompareRenderContext } from "./compareRenderContext";
import {
  buildCompareRuntimeArtifactIssues,
  createCompareRuntimeIssue,
  getBlockingCompareRuntimeIssues,
} from "./compareRuntimeIssues";

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

  const issues = buildCompareRuntimeArtifactIssues({
    metricSeriesErrorMessage: metricSeriesLoader.errorMessage,
    poseDataset: poseLoader.poseDataset,
    poseErrorMessage: poseLoader.errorMessage,
    recordDetail,
  });
  const blockingIssues = getBlockingCompareRuntimeIssues(issues);

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
