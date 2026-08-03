import { describe, expect, it } from "vitest";
import { BENCHMARK_SCENARIOS, classifyQuality, DEFAULT_SPRINT_7_QUALITY_POLICY, POSE_CONSUMER_POLICIES, POSE_DATA_AUTHORITY, POSE_QUALITY_TARGETS } from "./poseQualityPolicy";

describe("Task 75 quality policy", () => {
  it("is deeply immutable and has unique complete targets", () => {
    expect(Object.isFrozen(DEFAULT_SPRINT_7_QUALITY_POLICY)).toBe(true);
    expect(Object.isFrozen(POSE_QUALITY_TARGETS[0])).toBe(true);
    expect(new Set(POSE_QUALITY_TARGETS.map(({ id }) => id)).size).toBe(POSE_QUALITY_TARGETS.length);
    POSE_QUALITY_TARGETS.forEach((item) => {
      expect(item.unit && item.aggregation && item.evidence && item.status).toBeTruthy();
      expect([item.target, item.warning, item.failure].every(Number.isFinite)).toBe(true);
    });
  });

  it("classifies both directions deterministically and never passes nonfinite data", () => {
    const lower = { direction: "lower" as const, target: 10, warning: 20 };
    const higher = { direction: "higher" as const, target: 20, warning: 15 };
    expect([10, 15, 21].map((v) => classifyQuality(lower, v))).toEqual(["pass", "warning", "fail"]);
    expect([20, 16, 14].map((v) => classifyQuality(higher, v))).toEqual(["pass", "warning", "fail"]);
    expect(classifyQuality(lower, Number.NaN)).toBe("unavailable");
    expect(classifyQuality(higher, Number.POSITIVE_INFINITY)).toBe("unavailable");
  });

  it("locks authority, pose.v1, and the no-filter-persistence rule", () => {
    expect(POSE_DATA_AUTHORITY.rawCanonicalPose).toMatchObject({ authoritative: true, recordingInput: true, landmarkCount: 33 });
    expect(POSE_DATA_AUTHORITY.filteredRuntimePose).toMatchObject({ authoritative: false, runtimeOnly: true, persist: false, implemented: false });
    expect(POSE_DATA_AUTHORITY.persistedArtifact).toMatchObject({ schemaVersion: "pose.v1", source: "raw-canonical-pose", filteredCoordinates: false });
  });

  it("has unique scenario IDs and separates display from analysis", () => {
    expect(new Set(BENCHMARK_SCENARIOS.map(([id]) => id)).size).toBe(BENCHMARK_SCENARIOS.length);
    expect(POSE_CONSUMER_POLICIES.find(([name]) => name === "Live Capture Skeleton")).toEqual(["Live Capture Skeleton", "filtered-runtime-pose", "runtime-visualization", "identity-until-task-77", false]);
    expect(POSE_CONSUMER_POLICIES.find(([name]) => name === "Metric Series")).toEqual(["Metric Series", "raw-canonical-pose", "formal-analysis", "versioned-analysis-policy", true]);
    expect(JSON.stringify(DEFAULT_SPRINT_7_QUALITY_POLICY)).not.toContain("filteredCoordinates\":true");
  });
});
