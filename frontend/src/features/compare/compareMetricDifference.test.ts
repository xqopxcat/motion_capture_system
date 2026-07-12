import { describe, expect, it } from "vitest";
import {
  buildCompareMetricDifferenceRows,
  formatCompareMetricValue,
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

  it("formats missing and numeric values", () => {
    expect(formatCompareMetricValue(null, "degree")).toBe("Missing");
    expect(formatCompareMetricValue(12.3456, "degree")).toBe("12.35 degree");
  });
});
