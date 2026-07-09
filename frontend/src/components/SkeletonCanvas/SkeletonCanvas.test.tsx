import { describe, expect, it } from "vitest";
import type { PoseDatasetLandmark } from "../../types";
import { findHitJointId } from "./SkeletonCanvas";

const landmarks: PoseDatasetLandmark[] = [
  {
    id: 0,
    name: "nose",
    visibility: 0.9,
    x: 0.5,
    y: 0.5,
    z: 0,
  },
  {
    id: 1,
    name: "left_eye_inner",
    visibility: 0.2,
    x: 0.52,
    y: 0.5,
    z: 0,
  },
];

describe("SkeletonCanvas joint hit testing", () => {
  it("returns the nearest visible joint inside the hit radius", () => {
    expect(
      findHitJointId({
        canvasHeight: 100,
        canvasWidth: 100,
        landmarks,
        point: { x: 51, y: 50 },
      }),
    ).toBe(0);
  });

  it("ignores low-visibility and out-of-range joints", () => {
    expect(
      findHitJointId({
        canvasHeight: 100,
        canvasWidth: 100,
        landmarks,
        point: { x: 52, y: 50 },
        radius: 1,
      }),
    ).toBeNull();
  });
});
