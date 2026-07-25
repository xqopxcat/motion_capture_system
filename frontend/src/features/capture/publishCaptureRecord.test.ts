import { describe, expect, it } from "vitest";
import { buildKneeMetricSeries, sha256Hex } from "./publishCaptureRecord";
import type { PoseDataset } from "../../types";

function landmark(id: number, x = id / 100, y = id / 100) {
  return { id, name: `joint_${id}`, visibility: 1, x, y, z: 0 };
}

function poseDataset(): PoseDataset {
  const landmarks = Array.from({ length: 33 }, (_, id) => landmark(id));
  landmarks[23] = landmark(23, 0, 0);
  landmarks[25] = landmark(25, 0, 1);
  landmarks[27] = landmark(27, 1, 1);
  return {
    version: "1.0",
    poseEngine: "test",
    poseEngineVersion: "1",
    fps: 30,
    frameCount: 1,
    duration: 0,
    generatedAt: "2026-07-26T00:00:00Z",
    frames: [{
      frameIndex: 0,
      timestamp: 0,
      landmarks2D: landmarks,
      landmarks3D: landmarks,
    }],
  };
}

describe("production capture artifact preparation", () => {
  it("produces a lowercase SHA-256 hex checksum", async () => {
    await expect(sha256Hex(new Blob(["motion"]))).resolves.toBe(
      "305238273bb0fac2a73b43256e38d1515fdf61ec1d30ef161446c3588b93a97b",
    );
  });

  it("produces compatible knee metric series and summary metadata", () => {
    const result = buildKneeMetricSeries(poseDataset());

    expect(result.series.series[0]).toMatchObject({
      metricId: "knee_flexion",
      unit: "degree",
      values: [90],
    });
    expect(result.summary[0]).toMatchObject({
      activityType: "motion_capture",
      metricDefinitionVersion: "knee-flexion.v1",
      side: "left",
      unit: "degree",
    });
  });
});
