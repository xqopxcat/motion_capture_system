import { describe, expect, it } from "vitest";
import { BENCHMARK_SCENARIOS, classifyQuality, DEFAULT_SPRINT_7_QUALITY_POLICY, POSE_CONSUMER_POLICIES, POSE_DATA_AUTHORITY, POSE_QUALITY_TARGETS, validateQualityTarget, type QualityTarget } from "./poseQualityPolicy";

describe("Task 75 quality policy", () => {
  it("is deeply immutable and has unique complete targets", () => {
    expect(Object.isFrozen(DEFAULT_SPRINT_7_QUALITY_POLICY)).toBe(true);
    expect(Object.isFrozen(POSE_QUALITY_TARGETS[0])).toBe(true);
    expect(new Set(POSE_QUALITY_TARGETS.map(({ id }) => id)).size).toBe(POSE_QUALITY_TARGETS.length);
    POSE_QUALITY_TARGETS.forEach((item) => {
      expect(item.unit && item.aggregation && item.evidence && item.status).toBeTruthy();
      expect([item.passBoundary, item.failBoundary].every(Number.isFinite)).toBe(true);
      expect(validateQualityTarget(item)).toBe(item);
    });
  });

  it("classifies both directions deterministically and never passes nonfinite data", () => {
    const lower = { direction: "lower" as const, passBoundary: 10, failBoundary: 20 };
    const higher = { direction: "higher" as const, passBoundary: 20, failBoundary: 10 };
    expect([10, 15, 20].map((v) => classifyQuality(lower, v))).toEqual(["pass", "warning", "fail"]);
    expect([20, 15, 10].map((v) => classifyQuality(higher, v))).toEqual(["pass", "warning", "fail"]);
    expect(classifyQuality(lower, Number.NaN)).toBe("unavailable");
    expect(classifyQuality(higher, Number.POSITIVE_INFINITY)).toBe("unavailable");
  });

  it("rejects nonfinite and incorrectly ordered threshold contracts", () => {
    const base = POSE_QUALITY_TARGETS[0];
    expect(() => validateQualityTarget({ ...base, passBoundary: 20, failBoundary: 10 })).toThrow("out of order");
    const higher = POSE_QUALITY_TARGETS.find(({ direction }) => direction === "higher") as QualityTarget;
    expect(() => validateQualityTarget({ ...higher, passBoundary: 10, failBoundary: 20 })).toThrow("out of order");
    expect(() => validateQualityTarget({ ...base, failBoundary: Number.NaN })).toThrow("must be finite");
    expect(() => classifyQuality({ direction: "lower", passBoundary: 20, failBoundary: 10 }, 15)).toThrow("out of order");
  });

  it("collapses equal boundaries without inventing a warning range", () => {
    const stale = POSE_QUALITY_TARGETS.find(({ id }) => id === "stale-timeout")!;
    expect(classifyQuality(stale, stale.passBoundary)).toBe("pass");
    expect(classifyQuality(stale, stale.failBoundary + 1)).toBe("fail");
  });

  it("locks authority, pose.v1, and the no-filter-persistence rule", () => {
    expect(POSE_DATA_AUTHORITY.rawCanonicalPose).toMatchObject({ authoritative: true, recordingInput: true, landmarkCount: 33 });
    expect(POSE_DATA_AUTHORITY.filteredRuntimePose).toMatchObject({ authoritative: false, runtimeOnly: true, persist: false, boundaryImplemented: true, stabilizationImplemented: true });
    expect(POSE_DATA_AUTHORITY.persistedArtifact).toMatchObject({ schemaVersion: "pose.v1", source: "raw-canonical-pose", filteredCoordinates: false });
  });

  it("has unique scenario IDs and separates display from analysis", () => {
    expect(new Set(BENCHMARK_SCENARIOS.map(([id]) => id)).size).toBe(BENCHMARK_SCENARIOS.length);
    expect(POSE_CONSUMER_POLICIES.find(([name]) => name === "Live Capture Skeleton")).toEqual(["Live Capture Skeleton", "filtered-runtime-pose", "runtime-visualization", "stabilized.v1", false]);
    expect(POSE_CONSUMER_POLICIES.find(([name]) => name === "Metric Series")).toEqual(["Metric Series", "raw-canonical-pose", "formal-analysis", "versioned-analysis-policy", true]);
    expect(JSON.stringify(DEFAULT_SPRINT_7_QUALITY_POLICY)).not.toContain("filteredCoordinates\":true");
  });
});
