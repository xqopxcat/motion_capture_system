import { describe, expect, it } from "vitest";
import {
  buildCompareMetricDifferenceRows,
  formatCompareMetricValue,
  getCompareMetricSeriesDiagnostics,
  parseCompareMetricSeries,
} from "./compareMetricDifference";

describe("compareMetricDifference", () => {
  it("parses metric series array shape", () => {
    expect(
      parseCompareMetricSeries([
        {
          label: "Knee Flexion",
          metricId: "knee_flexion",
          unit: "degree",
          values: [10, 20],
        },
      ]),
    ).toEqual([
      {
        label: "Knee Flexion",
        metricId: "knee_flexion",
        unit: "degree",
        values: [10, 20],
      },
    ]);
  });

  it("builds right-minus-left metric difference rows", () => {
    expect(
      buildCompareMetricDifferenceRows({
        leftFrame: 1,
        leftMetricSeries: {
          series: [{ metricId: "knee_flexion", unit: "degree", values: [10, 20] }],
        },
        rightFrame: 1,
        rightMetricSeries: {
          series: [{ metricId: "knee_flexion", unit: "degree", values: [12, 25] }],
        },
      }),
    ).toEqual([
      {
        difference: 5,
        label: "knee_flexion",
        leftValue: 20,
        metricId: "knee_flexion",
        rightValue: 25,
        unit: "degree",
      },
    ]);
  });

  it("keeps rows when one side is missing", () => {
    expect(
      buildCompareMetricDifferenceRows({
        leftFrame: 0,
        leftMetricSeries: [{ metricId: "left_only", values: [1] }],
        rightFrame: 0,
        rightMetricSeries: [],
      })[0],
    ).toMatchObject({
      difference: null,
      leftValue: 1,
      rightValue: null,
    });
  });

  it("reads values from independent left and right frames", () => {
    expect(
      buildCompareMetricDifferenceRows({
        leftFrame: 0,
        leftMetricSeries: [{ metricId: "hip_height", values: [3, 30] }],
        rightFrame: 1,
        rightMetricSeries: [{ metricId: "hip_height", values: [4, 40] }],
      })[0],
    ).toMatchObject({
      difference: 37,
      leftValue: 3,
      rightValue: 40,
    });
  });

  it("handles missing frame values without calculating a difference", () => {
    expect(
      buildCompareMetricDifferenceRows({
        leftFrame: 5,
        leftMetricSeries: [{ metricId: "knee_flexion", values: [10] }],
        rightFrame: 0,
        rightMetricSeries: [{ metricId: "knee_flexion", values: [12] }],
      })[0],
    ).toMatchObject({
      difference: null,
      leftValue: null,
      rightValue: 12,
    });
  });

  it("returns no rows when there are no comparable metric ids", () => {
    expect(
      buildCompareMetricDifferenceRows({
        leftFrame: 0,
        leftMetricSeries: null,
        rightFrame: 0,
        rightMetricSeries: { series: [] },
      }),
    ).toEqual([]);
  });

  it("falls back to metricId when a label is missing", () => {
    expect(
      buildCompareMetricDifferenceRows({
        leftFrame: 0,
        leftMetricSeries: [{ metricId: "ankle_speed", values: [1] }],
        rightFrame: 0,
        rightMetricSeries: [{ metricId: "ankle_speed", values: [2] }],
      })[0].label,
    ).toBe("ankle_speed");
  });

  it("reports missing or invalid metric series diagnostics", () => {
    expect(getCompareMetricSeriesDiagnostics(null)).toEqual({
      hasInput: false,
      isValid: true,
      message: "Metric Series is missing.",
    });
    expect(getCompareMetricSeriesDiagnostics({ series: [{ values: [1] }] })).toEqual({
      hasInput: true,
      isValid: false,
      message: "Metric Series JSON has no valid metric values.",
    });
  });

  it("formats missing and numeric values", () => {
    expect(formatCompareMetricValue(null, "degree")).toBe("Missing");
    expect(formatCompareMetricValue(12.3456, "degree")).toBe("12.35 degree");
  });
});
