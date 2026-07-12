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

export function formatCompareMetricValue(value: number | null, unit: string | null) {
  if (value === null) {
    return "Missing";
  }

  const formattedValue = Number.isInteger(value) ? String(value) : value.toFixed(2);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
}
