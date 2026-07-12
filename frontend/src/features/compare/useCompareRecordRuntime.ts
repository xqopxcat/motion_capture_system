import { useMemo } from "react";
import { useMetricSeriesLoader, usePoseLoader } from "../../hooks";
import { useGetRecordDetailQuery } from "../../services/recordsApi";
import type { CompareRecordRuntimeState } from "../../types";
import { createCompareRenderContext } from "./compareRenderContext";

export function useCompareRecordRuntime(
  recordId: string | null,
  canvasId: string,
): CompareRecordRuntimeState {
  const {
    data: recordDetail,
    isError: isRecordError,
    isLoading: isRecordLoading,
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
      metricSeries: null,
      poseDataset: null,
      recordDetail: null,
      renderContext,
      status: "idle",
      videoSrc: null,
    };
  }

  if (isRecordLoading || poseLoader.isPoseLoading || metricSeriesLoader.isMetricSeriesLoading) {
    return {
      errorMessage: null,
      metricSeries: metricSeriesLoader.metricSeries,
      poseDataset: poseLoader.poseDataset,
      recordDetail: recordDetail ?? null,
      renderContext,
      status: "loading",
      videoSrc: recordDetail?.video?.url ?? null,
    };
  }

  if (isRecordError || !recordDetail) {
    return {
      errorMessage: "Record Detail could not be loaded.",
      metricSeries: null,
      poseDataset: null,
      recordDetail: null,
      renderContext,
      status: "error",
      videoSrc: null,
    };
  }

  if (recordDetail.status !== "Ready") {
    return {
      errorMessage: `Record is ${recordDetail.status}. Compare requires Ready Records.`,
      metricSeries: null,
      poseDataset: null,
      recordDetail,
      renderContext,
      status: "missing",
      videoSrc: null,
    };
  }

  if (poseLoader.errorMessage || metricSeriesLoader.errorMessage) {
    return {
      errorMessage: poseLoader.errorMessage ?? metricSeriesLoader.errorMessage,
      metricSeries: metricSeriesLoader.metricSeries,
      poseDataset: poseLoader.poseDataset,
      recordDetail,
      renderContext,
      status: "error",
      videoSrc: recordDetail.video?.url ?? null,
    };
  }

  if (!recordDetail.video?.url || !recordDetail.pose?.url || !poseLoader.poseDataset) {
    return {
      errorMessage: "Ready Record is missing video or pose runtime data.",
      metricSeries: metricSeriesLoader.metricSeries,
      poseDataset: poseLoader.poseDataset,
      recordDetail,
      renderContext,
      status: "missing",
      videoSrc: recordDetail.video?.url ?? null,
    };
  }

  return {
    errorMessage: null,
    metricSeries: metricSeriesLoader.metricSeries,
    poseDataset: poseLoader.poseDataset,
    recordDetail,
    renderContext,
    status: "ready",
    videoSrc: recordDetail.video.url,
  };
}
