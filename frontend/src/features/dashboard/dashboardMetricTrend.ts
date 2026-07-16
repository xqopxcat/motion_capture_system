import type {
  DashboardMetricTrend,
  DashboardMetricTrendPoint,
} from "../../types";

const CHART_WIDTH = 800;
const CHART_HEIGHT = 280;
const CHART_PADDING = {
  bottom: 46,
  left: 62,
  right: 24,
  top: 24,
} as const;

export type DashboardTrendChartPoint = DashboardMetricTrendPoint & {
  x: number;
  y: number;
};

export type DashboardTrendChartModel = {
  height: number;
  linePath: string;
  plotBottom: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  points: DashboardTrendChartPoint[];
  width: number;
  xLabels: Array<{ label: string; x: number }>;
  yTicks: Array<{ label: string; value: number; y: number }>;
};

export function buildDashboardTrendSeriesKey(trend: DashboardMetricTrend) {
  return JSON.stringify([
    trend.metricId,
    trend.unit,
    trend.metricDefinitionVersion,
    trend.activityType,
    trend.side,
  ]);
}

export function formatDashboardTrendSeriesLabel(trend: DashboardMetricTrend) {
  return `${trend.metricId} — ${trend.activityType} / ${trend.side} — ${trend.unit}`;
}

export function findDashboardTrendSeries(
  trends: DashboardMetricTrend[],
  selectedKey: string | null,
) {
  if (trends.length === 0) {
    return null;
  }

  return trends.find((trend) => buildDashboardTrendSeriesKey(trend) === selectedKey) ?? trends[0];
}

export function buildDashboardTrendChartModel(
  points: DashboardMetricTrendPoint[],
): DashboardTrendChartModel | null {
  const validPoints = points
    .filter((point) => Number.isFinite(point.value) && Number.isFinite(Date.parse(point.createdAt)))
    .slice()
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));

  if (validPoints.length < 2) {
    return null;
  }

  const values = validPoints.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const domainPadding = rawMin === rawMax ? Math.max(Math.abs(rawMin) * 0.1, 1) : 0;
  const minimum = rawMin - domainPadding;
  const maximum = rawMax + domainPadding;
  const plotLeft = CHART_PADDING.left;
  const plotRight = CHART_WIDTH - CHART_PADDING.right;
  const plotTop = CHART_PADDING.top;
  const plotBottom = CHART_HEIGHT - CHART_PADDING.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const valueRange = maximum - minimum;

  const chartPoints = validPoints.map((point, index) => ({
    ...point,
    x: plotLeft + (index / (validPoints.length - 1)) * plotWidth,
    y: plotBottom - ((point.value - minimum) / valueRange) * plotHeight,
  }));
  const middle = minimum + valueRange / 2;
  const yTickValues = [maximum, middle, minimum];

  return {
    height: CHART_HEIGHT,
    linePath: chartPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" "),
    plotBottom,
    plotLeft,
    plotRight,
    plotTop,
    points: chartPoints,
    width: CHART_WIDTH,
    xLabels: [chartPoints[0], chartPoints[chartPoints.length - 1]].map((point) => ({
      label: formatTrendDate(point.createdAt),
      x: point.x,
    })),
    yTicks: yTickValues.map((value) => ({
      label: formatTrendValue(value),
      value,
      y: plotBottom - ((value - minimum) / valueRange) * plotHeight,
    })),
  };
}

export function formatTrendDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export function formatTrendValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
