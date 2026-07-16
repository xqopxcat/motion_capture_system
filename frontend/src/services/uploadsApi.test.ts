import { describe, expect, it } from "vitest";
import { uploadsApi } from "./uploadsApi";
import type { MetricsUploadCompleteRequest } from "../types";

describe("uploadsApi", () => {
  it("exposes signed upload URL request mutations", () => {
    expect(uploadsApi.endpoints.requestVideoUploadUrl).toBeDefined();
    expect(uploadsApi.endpoints.requestPoseUploadUrl).toBeDefined();
    expect(uploadsApi.endpoints.requestMetricsUploadUrl).toBeDefined();
    expect(uploadsApi.endpoints.requestThumbnailUploadUrl).toBeDefined();
  });

  it("exposes artifact complete mutations", () => {
    expect(uploadsApi.endpoints.completeVideoUpload).toBeDefined();
    expect(uploadsApi.endpoints.completePoseUpload).toBeDefined();
    expect(uploadsApi.endpoints.completeMetricsUpload).toBeDefined();
    expect(uploadsApi.endpoints.completeThumbnailUpload).toBeDefined();
  });

  it("types metric summary on the metrics complete request", () => {
    const body: MetricsUploadCompleteRequest = {
      recordId: "record_123",
      storagePath: "metrics/record_123/metric-series.v1.json",
      version: "1.0",
      summary: [
        {
          activityType: "squat",
          average: 75,
          max: 120,
          metricDefinitionVersion: "knee-flexion.v1",
          metricId: "knee_flexion",
          min: 30,
          rangeOfMotion: 90,
          side: "left",
          unit: "degree",
        },
      ],
    };

    expect(body.summary[0].metricId).toBe("knee_flexion");
    expect(body.summary[0].rangeOfMotion).toBe(90);
    expect(body.summary[0].metricDefinitionVersion).toBe("knee-flexion.v1");
  });
});
