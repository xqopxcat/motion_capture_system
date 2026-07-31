import { describe, expect, it } from "vitest";
import {
  classifyProductionConnectionSide,
  classifyProductionLandmarkSide,
  PRODUCTION_SKELETON_CONNECTIONS,
  PRODUCTION_SKELETON_LANDMARK_INDEXES,
  PRODUCTION_SKELETON_PROFILE,
} from "./productionSkeletonProfile";

describe("Production Skeleton Display Profile", () => {
  it("uses the approved full-body landmark subset without face or finger clutter", () => {
    expect(PRODUCTION_SKELETON_LANDMARK_INDEXES).toEqual([
      0, 11, 12, 13, 14, 15, 16, 19, 20, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    ]);
    expect(PRODUCTION_SKELETON_PROFILE.visibleLandmarkIndexes.size).toBe(19);
  });

  it("defines only approved shoulder, arm, torso, hip, leg and foot connections", () => {
    expect(PRODUCTION_SKELETON_CONNECTIONS).toHaveLength(20);
    expect(PRODUCTION_SKELETON_CONNECTIONS).toContainEqual([11, 12]);
    expect(PRODUCTION_SKELETON_CONNECTIONS).toContainEqual([11, 23]);
    expect(PRODUCTION_SKELETON_CONNECTIONS).toContainEqual([27, 31]);
    expect(PRODUCTION_SKELETON_CONNECTIONS).not.toContainEqual([15, 17]);
  });

  it("locks named visibility, presence and stale-age thresholds", () => {
    expect(PRODUCTION_SKELETON_PROFILE.minimumVisibilityThreshold).toBe(0.35);
    expect(PRODUCTION_SKELETON_PROFILE.minimumPresenceThreshold).toBe(0.35);
    expect(PRODUCTION_SKELETON_PROFILE.highConfidenceThreshold).toBe(0.65);
    expect(PRODUCTION_SKELETON_PROFILE.maximumPoseAgeMs).toBe(300);
  });

  it("classifies left, right and center visuals without relying only on color", () => {
    expect(classifyProductionLandmarkSide(11)).toBe("left");
    expect(classifyProductionLandmarkSide(12)).toBe("right");
    expect(classifyProductionLandmarkSide(0)).toBe("center");
    expect(classifyProductionConnectionSide([11, 13])).toBe("left");
    expect(classifyProductionConnectionSide([11, 12])).toBe("center");
    expect(PRODUCTION_SKELETON_PROFILE.sideStyles.left.jointShape).toBe("circle");
    expect(PRODUCTION_SKELETON_PROFILE.sideStyles.right.jointShape).toBe("square");
    expect(PRODUCTION_SKELETON_PROFILE.sideStyles.right.dash.length).toBeGreaterThan(0);
  });
});
