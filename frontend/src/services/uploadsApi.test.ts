import { describe, expect, it } from "vitest";
import { uploadsApi } from "./uploadsApi";

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
});
