import { describe, expect, it } from "vitest";
import type { DashboardMetricTrend } from "../../types";
import {
  buildDashboardTrendChartModel,
  buildDashboardTrendSeriesKey,
  findDashboardTrendSeries,
  formatDashboardTrendSeriesLabel,
  formatTrendValue,
} from "./dashboardMetricTrend";

function createTrend(overrides: Partial<DashboardMetricTrend> = {}): DashboardMetricTrend {
  return {
    metricId: "knee_flexion",
    unit: "degree",
    metricDefinitionVersion: "knee-flexion.v1",
    activityType: "squat",
    side: "left",
    statistic: "average",
    points: [],
    ...overrides,
  };
}

describe("dashboardMetricTrend", () => {
  it("builds a stable compatibility series key and readable label", () => {
    const trend = createTrend();

    expect(buildDashboardTrendSeriesKey(trend)).toBe(
      '["knee_flexion","degree","knee-flexion.v1","squat","left"]',
    );
    expect(formatDashboardTrendSeriesLabel(trend)).toBe(
      "knee_flexion — squat / left — degree",
    );
  });

  it("defaults to the first API series and preserves a valid selection", () => {
    const first = createTrend();
    const second = createTrend({ side: "right" });

    expect(findDashboardTrendSeries([first, second], null)).toBe(first);
    expect(
      findDashboardTrendSeries([first, second], buildDashboardTrendSeriesKey(second)),
    ).toBe(second);
    expect(findDashboardTrendSeries([first, second], "missing")).toBe(first);
    expect(findDashboardTrendSeries([], null)).toBeNull();
  });

  it("requires two valid points and sorts points chronologically without mutation", () => {
    const points = [
      {
        recordId: "later",
        recordTitle: "Later",
        status: "Ready" as const,
        createdAt: "2026-07-17T00:00:00Z",
        value: 80,
      },
      {
        recordId: "earlier",
        recordTitle: "Earlier",
        status: "Ready" as const,
        createdAt: "2026-07-01T00:00:00Z",
        value: 70,
      },
    ];

    const model = buildDashboardTrendChartModel(points);

    expect(model?.points.map((point) => point.recordId)).toEqual(["earlier", "later"]);
    expect(points.map((point) => point.recordId)).toEqual(["later", "earlier"]);
    expect(model?.linePath).toContain("M ");
    expect(buildDashboardTrendChartModel(points.slice(0, 1))).toBeNull();
  });

  it("handles a flat series with finite chart coordinates", () => {
    const model = buildDashboardTrendChartModel([
      {
        recordId: "a",
        recordTitle: "A",
        status: "Ready",
        createdAt: "2026-07-01T00:00:00Z",
        value: 75,
      },
      {
        recordId: "b",
        recordTitle: "B",
        status: "Ready",
        createdAt: "2026-07-02T00:00:00Z",
        value: 75,
      },
    ]);

    expect(model?.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });

  it("drops invalid dates and non-finite values", () => {
    const model = buildDashboardTrendChartModel([
      {
        recordId: "invalid-date",
        recordTitle: "Invalid",
        status: "Ready",
        createdAt: "bad",
        value: 10,
      },
      {
        recordId: "invalid-value",
        recordTitle: "Invalid",
        status: "Ready",
        createdAt: "2026-07-01T00:00:00Z",
        value: Number.NaN,
      },
    ]);

    expect(model).toBeNull();
  });

  it("formats numeric values without implying a score", () => {
    expect(formatTrendValue(75)).toBe("75");
    expect(formatTrendValue(75.25)).toBe("75.25");
  });
});
