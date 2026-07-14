import { describe, expect, it } from "vitest";
import {
  buildCompareRuntimeArtifactIssues,
  createCompareRuntimeIssue,
  getBlockingCompareRuntimeIssues,
  getPrimaryCompareRuntimeMessage,
  hasBlockingCompareRuntimeIssue,
} from "./compareRuntimeIssues";
import type { CompareRecordRuntimeState, PoseDataset, RecordDetail } from "../../types";

function createRuntime(issues: CompareRecordRuntimeState["issues"]): CompareRecordRuntimeState {
  return {
    errorMessage: null,
    issues,
    metricSeries: null,
    poseDataset: null,
    recordDetail: null,
    renderContext: {
      canvasId: "test",
      frameIndex: 0,
      mode: "none",
      poseFrame: null,
    },
    retry: null,
    status: "missing",
    videoSrc: null,
  };
}

describe("compareRuntimeIssues", () => {
  it("detects blocking issues", () => {
    const runtime = createRuntime([
      createCompareRuntimeIssue({
        artifact: "metrics",
        message: "Metric Series is missing.",
        severity: "warning",
      }),
      createCompareRuntimeIssue({
        artifact: "pose",
        message: "Pose Dataset is missing.",
        severity: "blocking",
      }),
    ]);

    expect(hasBlockingCompareRuntimeIssue(runtime)).toBe(true);
    expect(getPrimaryCompareRuntimeMessage(runtime)).toBe("Pose Dataset is missing.");
  });

  it("classifies missing video and pose artifact URLs as blocking", () => {
    const issues = buildCompareRuntimeArtifactIssues({
      metricSeriesErrorMessage: null,
      poseDataset: createPoseDataset(),
      poseErrorMessage: null,
      recordDetail: createRecordDetail({
        pose: { url: "", version: "pose.v1" },
        video: { duration: 1, fps: 30, url: "" },
      }),
    });

    expect(getBlockingCompareRuntimeIssues(issues)).toEqual([
      expect.objectContaining({
        artifact: "video",
        message: "Ready Record is missing a video URL.",
      }),
      expect.objectContaining({
        artifact: "pose",
        message: "Ready Record is missing a Pose Dataset URL.",
      }),
    ]);
  });

  it("classifies missing artifact metadata and empty pose frames", () => {
    const missingMetadataIssues = buildCompareRuntimeArtifactIssues({
      metricSeriesErrorMessage: null,
      poseDataset: null,
      poseErrorMessage: null,
      recordDetail: createRecordDetail({
        metrics: null,
        pose: null,
        video: null,
      }),
    });

    expect(missingMetadataIssues).toEqual([
      expect.objectContaining({ artifact: "video", severity: "blocking" }),
      expect.objectContaining({ artifact: "pose", severity: "blocking" }),
      expect.objectContaining({ artifact: "metrics", severity: "warning" }),
    ]);

    const emptyPoseIssues = buildCompareRuntimeArtifactIssues({
      metricSeriesErrorMessage: null,
      poseDataset: createPoseDataset({ frames: [] }),
      poseErrorMessage: null,
      recordDetail: createRecordDetail(),
    });

    expect(emptyPoseIssues).toContainEqual(
      expect.objectContaining({
        artifact: "pose",
        message: "Pose Dataset has no renderable frames.",
        severity: "blocking",
      }),
    );
  });

  it("classifies invalid pose and metric series loader errors", () => {
    const issues = buildCompareRuntimeArtifactIssues({
      metricSeriesErrorMessage: "Metric Series JSON is invalid.",
      poseDataset: null,
      poseErrorMessage: "pose.v1 validation failed.",
      recordDetail: createRecordDetail(),
    });

    expect(issues).toEqual([
      expect.objectContaining({
        artifact: "pose",
        debugMessage: "pose.v1 validation failed.",
        message: "Pose Dataset could not be loaded or validated.",
        severity: "blocking",
      }),
      expect.objectContaining({
        artifact: "metrics",
        debugMessage: "Metric Series JSON is invalid.",
        message: "Metric Series could not be loaded.",
        severity: "warning",
      }),
    ]);
  });
});

function createRecordDetail(overrides: Partial<RecordDetail> = {}): RecordDetail {
  return {
    createdAt: "2026-07-01T00:00:00.000Z",
    description: "Ready record",
    metrics: {
      seriesUrl: "mock-storage.local/download/metrics/record_a/metric-series.v1.json",
      summary: [],
    },
    pose: {
      url: "mock-storage.local/download/pose/record_a/pose.v1.json",
      version: "pose.v1",
    },
    recordId: "record_a",
    status: "Ready",
    tags: [],
    title: "Record A",
    video: {
      duration: 1,
      fps: 30,
      url: "mock-storage.local/download/video/record_a.mp4",
    },
    ...overrides,
  };
}

function createPoseDataset(overrides: Partial<PoseDataset> = {}): PoseDataset {
  return {
    duration: 1,
    fps: 30,
    frameCount: 1,
    frames: [
      {
        frameIndex: 0,
        landmarks2D: [],
        landmarks3D: [],
        timestamp: 0,
      },
    ],
    generatedAt: "2026-07-01T00:00:00.000Z",
    poseEngine: "test",
    poseEngineVersion: "1.0.0",
    version: "pose.v1",
    ...overrides,
  };
}
