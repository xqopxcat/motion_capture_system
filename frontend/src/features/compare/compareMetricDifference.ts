export type CompareMetricSeriesItem = {
  label?: string;
  metricId: string;
  unit?: string;
  values: number[];
};

export type CompareMetricDifferenceRow = {
  difference: number | null;
  label: string;
  leftValue: number | null;
  metricId: string;
  rightValue: number | null;
  unit: string | null;
};

export type CompareMetricSeriesDiagnostics = {
  hasInput: boolean;
  isValid: boolean;
  message: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseMetricSeriesItem(value: unknown): CompareMetricSeriesItem | null {
  if (!isRecord(value) || typeof value.metricId !== "string" || !Array.isArray(value.values)) {
    return null;
  }

  return {
    label: typeof value.label === "string" ? value.label : undefined,
    metricId: value.metricId,
    unit: typeof value.unit === "string" ? value.unit : undefined,
    values: value.values.map((item) => (typeof item === "number" ? item : Number.NaN)),
  };
}

export function parseCompareMetricSeries(metricSeries: unknown): CompareMetricSeriesItem[] {
  if (Array.isArray(metricSeries)) {
    return metricSeries.map(parseMetricSeriesItem).filter((item): item is CompareMetricSeriesItem => item !== null);
  }

  if (!isRecord(metricSeries)) {
    return [];
  }

  const candidateSeries = metricSeries.series ?? metricSeries.metrics;
  if (!Array.isArray(candidateSeries)) {
    return [];
  }

  return candidateSeries
    .map(parseMetricSeriesItem)
    .filter((item): item is CompareMetricSeriesItem => item !== null);
}

export function getCompareMetricSeriesDiagnostics(
  metricSeries: unknown,
): CompareMetricSeriesDiagnostics {
  if (metricSeries === null || typeof metricSeries === "undefined") {
    return {
      hasInput: false,
      isValid: true,
      message: "Metric Series is missing.",
    };
  }

  const parsedSeries = parseCompareMetricSeries(metricSeries);

  return {
    hasInput: true,
    isValid: parsedSeries.length > 0,
    message: parsedSeries.length > 0 ? null : "Metric Series JSON has no valid metric values.",
  };
}

function getFrameValue(metric: CompareMetricSeriesItem | undefined, frameIndex: number) {
  if (!metric || !Number.isInteger(frameIndex) || frameIndex < 0) {
    return null;
  }

  const value = metric.values[frameIndex];

  return Number.isFinite(value) ? value : null;
}

export function buildCompareMetricDifferenceRows({
  leftFrame,
  leftMetricSeries,
  rightFrame,
  rightMetricSeries,
}: {
  leftFrame: number;
  leftMetricSeries: unknown;
  rightFrame: number;
  rightMetricSeries: unknown;
}): CompareMetricDifferenceRow[] {
  const leftSeries = parseCompareMetricSeries(leftMetricSeries);
  const rightSeries = parseCompareMetricSeries(rightMetricSeries);
  const metricIds = Array.from(
    new Set([
      ...leftSeries.map((metric) => metric.metricId),
      ...rightSeries.map((metric) => metric.metricId),
    ]),
  );

  return metricIds.map((metricId) => {
    const leftMetric = leftSeries.find((metric) => metric.metricId === metricId);
    const rightMetric = rightSeries.find((metric) => metric.metricId === metricId);
    const leftValue = getFrameValue(leftMetric, leftFrame);
    const rightValue = getFrameValue(rightMetric, rightFrame);

    return {
      difference: leftValue === null || rightValue === null ? null : rightValue - leftValue,
      label: leftMetric?.label ?? rightMetric?.label ?? metricId,
      leftValue,
      metricId,
      rightValue,
      unit: leftMetric?.unit ?? rightMetric?.unit ?? null,
    };
  });
}

function resolvePoseFrame(dataset: PoseDataset | null, frameIndex: number): PoseDatasetFrame | null {
  if (!dataset || !Number.isInteger(frameIndex) || frameIndex < 0) return null;
  return dataset.frames.find((frame) => frame.frameIndex === frameIndex) ?? dataset.frames[frameIndex] ?? null;
}

function calculatePoseFrameMetrics(dataset: PoseDataset | null, frameIndex: number) {
  const frame = resolvePoseFrame(dataset, frameIndex);
  if (!frame) return new Map<string, number>();
  const results = calculateSelectedFormalJointAngles({
    frameIndex: frame.frameIndex,
    timestampMs: frame.timestamp * 1000,
    landmarks2D: frame.landmarks2D,
    landmarks3D: frame.landmarks3D,
  }, JOINT_ANGLE_REGISTRY.map(({ metricId }) => metricId));
  return new Map(results.flatMap((result) => result.valueDegrees === null ? [] : [[result.metricId, result.valueDegrees]]));
}

/** Derives frame-aligned values from authoritative pose.v1 instead of compressed metrics.v1 arrays. */
export function buildPoseFrameMetricDifferenceRows({
  leftFrame,
  leftPoseDataset,
  rightFrame,
  rightPoseDataset,
}: {
  leftFrame: number;
  leftPoseDataset: PoseDataset | null;
  rightFrame: number;
  rightPoseDataset: PoseDataset | null;
}): CompareMetricDifferenceRow[] {
  const leftValues = calculatePoseFrameMetrics(leftPoseDataset, leftFrame);
  const rightValues = calculatePoseFrameMetrics(rightPoseDataset, rightFrame);

  return JOINT_ANGLE_REGISTRY.map((definition) => {
    const leftValue = leftValues.get(definition.metricId) ?? null;
    const rightValue = rightValues.get(definition.metricId) ?? null;
    return {
      difference: leftValue === null || rightValue === null ? null : rightValue - leftValue,
      label: definition.displayLabel,
      leftValue,
      metricId: definition.metricId,
      rightValue,
      unit: "degree",
    };
  });
}

export function formatCompareMetricValue(value: number | null, unit: string | null) {
  if (value === null) {
    return "Missing";
  }

  const formattedValue = Number.isInteger(value) ? String(value) : value.toFixed(2);

  return unit === "degree" || unit === "degrees" ? `${formattedValue}°` : unit ? `${formattedValue} ${unit}` : formattedValue;
}
import { calculateSelectedFormalJointAngles, JOINT_ANGLE_REGISTRY } from "../../engines/motionModel";
import type { PoseDataset, PoseDatasetFrame } from "../../types";
