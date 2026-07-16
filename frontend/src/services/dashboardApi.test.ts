import { describe, expect, it } from "vitest";
import type { DashboardSummaryResponse } from "../types";
import { dashboardApi } from "./dashboardApi";


describe("dashboardApi", () => {
  it("exposes one Dashboard Summary query endpoint", () => {
    expect(dashboardApi.endpoints.getDashboardSummary).toBeDefined();
  });

  it("types the compatibility-safe trend contract", () => {
    const response: DashboardSummaryResponse = {
      counts: {
        totalRecords: 2,
        readyRecords: 2,
        failedRecords: 0,
        recentActivityCount: 2,
        recentActivityWindowDays: 30,
      },
      metricTrends: [
        {
          metricId: "knee_flexion",
          unit: "degree",
          metricDefinitionVersion: "knee-flexion.v1",
          activityType: "squat",
          side: "left",
          statistic: "average",
          points: [
            {
              recordId: "record_1",
              recordTitle: "Session 1",
              createdAt: "2026-07-17T00:00:00Z",
              value: 75,
            },
          ],
        },
      ],
    };

    expect(response.metricTrends[0].statistic).toBe("average");
  });
});
