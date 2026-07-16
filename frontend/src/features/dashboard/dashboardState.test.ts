import { describe, expect, it, vi } from "vitest";
import type { DashboardMetricTrend, DashboardTrendAvailability } from "../../types";
import {
  getDashboardIntegrationState,
  getDashboardTrendContentState,
  normalizeDashboardMetricTrends,
  normalizeDashboardRecords,
  normalizeTrendAvailability,
  retryFailedDashboardQueries,
} from "./dashboardState";

const compatibleAvailability: DashboardTrendAvailability = {
  readyRecords: 2,
  recordsWithMetricSummary: 2,
  recordsWithCompatibleMetricSummary: 2,
};

function trend(pointCount: number): DashboardMetricTrend {
  return {
    metricId: "knee_flexion",
    unit: "degree",
    metricDefinitionVersion: "v1",
    activityType: "squat",
    side: "left",
    statistic: "average",
    points: Array.from({ length: pointCount }, (_, index) => ({
      recordId: `record_${index}`,
      recordTitle: `Record ${index}`,
      status: "Ready",
      createdAt: `2026-07-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
      value: 70 + index,
    })),
  };
}

describe("Dashboard state orchestration", () => {
  it("retries only the query that failed", () => {
    const refetchRecords = vi.fn();
    const refetchTrend = vi.fn();

    retryFailedDashboardQueries({
      recordsError: false,
      refetchRecords,
      refetchTrend,
      trendError: true,
    });

    expect(refetchRecords).not.toHaveBeenCalled();
    expect(refetchTrend).toHaveBeenCalledOnce();
  });

  it("identifies initial loading and section-specific loading", () => {
    expect(getDashboardIntegrationState({
      recordsError: false,
      recordsLoading: true,
      trendError: false,
      trendLoading: true,
    })).toMatchObject({ isInitialLoading: true, isFullFailure: false });

    expect(getDashboardIntegrationState({
      recordsError: false,
      recordsLoading: true,
      trendError: false,
      trendLoading: false,
    })).toMatchObject({ isInitialLoading: false, isFullFailure: false });
  });

  it("identifies both partial-success directions and all-query failure", () => {
    expect(getDashboardIntegrationState({
      recordsError: false,
      recordsLoading: false,
      trendError: true,
      trendLoading: false,
    }).isPartialSuccess).toBe(true);
    expect(getDashboardIntegrationState({
      recordsError: true,
      recordsLoading: false,
      trendError: false,
      trendLoading: false,
    }).isPartialSuccess).toBe(true);
    expect(getDashboardIntegrationState({
      recordsError: true,
      recordsLoading: false,
      trendError: true,
      trendLoading: false,
    }).isFullFailure).toBe(true);
  });

  it.each([
    [{ readyRecords: 0, recordsWithMetricSummary: 0, recordsWithCompatibleMetricSummary: 0 }, "no-ready"],
    [{ readyRecords: 2, recordsWithMetricSummary: 0, recordsWithCompatibleMetricSummary: 0 }, "no-summary"],
    [{ readyRecords: 2, recordsWithMetricSummary: 1, recordsWithCompatibleMetricSummary: 0 }, "no-compatible"],
  ] as const)("maps availability %o to %s", (availability, expected) => {
    expect(getDashboardTrendContentState(availability, null)).toBe(expected);
  });

  it("distinguishes zero, one, and multiple compatible points", () => {
    expect(getDashboardTrendContentState(compatibleAvailability, trend(0))).toBe("no-history");
    expect(getDashboardTrendContentState(compatibleAvailability, trend(1))).toBe("single-point");
    expect(getDashboardTrendContentState(compatibleAvailability, trend(2))).toBe("trend");
    expect(getDashboardTrendContentState(null, trend(2))).toBe("unavailable");
  });
});

describe("Dashboard defensive normalization", () => {
  it("normalizes missing Record presentation fields and preserves unknown status", () => {
    expect(normalizeDashboardRecords([{
      recordId: " record_1 ",
      title: "",
      status: "Archived",
      createdAt: "bad",
      duration: null,
      tags: [],
    }])).toEqual([{
      recordId: "record_1",
      title: "Untitled Record",
      description: "",
      thumbnailUrl: null,
      duration: null,
      status: "Archived",
      tags: [],
      createdAt: "bad",
    }]);
    expect(normalizeDashboardRecords(null)).toBeNull();
  });

  it("omits malformed trend points without converting them to zero or mutating input", () => {
    const input = [{
      ...trend(2),
      points: [
        ...trend(2).points,
        { recordId: "bad", recordTitle: "Bad", status: "Ready", createdAt: "bad", value: 0 },
        { recordId: "nan", recordTitle: "NaN", status: "Ready", createdAt: "2026-07-03T00:00:00Z", value: Number.NaN },
      ],
    }];

    const normalized = normalizeDashboardMetricTrends(input);

    expect(normalized?.[0].points).toHaveLength(2);
    expect(input[0].points).toHaveLength(4);
    expect(normalized?.[0].points.some((point) => point.value === 0)).toBe(false);
  });

  it("keeps a compatible series with zero valid points for no-history state", () => {
    const normalized = normalizeDashboardMetricTrends([{ ...trend(1), points: [] }]);

    expect(normalized).toHaveLength(1);
    expect(normalized?.[0].points).toEqual([]);
  });

  it("rejects missing compatibility fields and inconsistent availability counts", () => {
    expect(normalizeDashboardMetricTrends([{ ...trend(1), unit: null }])).toEqual([]);
    expect(normalizeDashboardMetricTrends(null)).toBeNull();
    expect(normalizeTrendAvailability({
      readyRecords: 1,
      recordsWithMetricSummary: 2,
      recordsWithCompatibleMetricSummary: 0,
    })).toBeNull();
    expect(normalizeTrendAvailability({
      readyRecords: 2,
      recordsWithMetricSummary: 1,
      recordsWithCompatibleMetricSummary: 1,
    })).toEqual({
      readyRecords: 2,
      recordsWithMetricSummary: 1,
      recordsWithCompatibleMetricSummary: 1,
    });
  });
});
