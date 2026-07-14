import { describe, expect, it } from "vitest";
import {
  createCompareRuntimeIssue,
  getPrimaryCompareRuntimeMessage,
  hasBlockingCompareRuntimeIssue,
} from "./compareRuntimeIssues";
import type { CompareRecordRuntimeState } from "../../types";

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
});
