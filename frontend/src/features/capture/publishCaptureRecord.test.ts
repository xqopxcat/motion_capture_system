import { describe, expect, it } from "vitest";
import { CapturePreparationError, buildCapturePublishRecoveryPlan, buildKneeMetricSeries, capturePreparationFailureCode, seekVideoForThumbnail, sha256Hex, waitForVideoLoadedData } from "./publishCaptureRecord";
import type { PoseDataset } from "../../types";
import { JOINT_ANGLE_REGISTRY } from "../../engines/motionModel";

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
  it("does not miss an already-fired loadeddata state", async () => {
    await expect(waitForVideoLoadedData({ readyState: 2 } as HTMLVideoElement)).resolves.toBeUndefined();
  });

  it("attaches the seek listener before changing currentTime", async () => {
    const target = new EventTarget() as EventTarget & { currentTime: number };
    let currentTime = 0;
    Object.defineProperty(target, "currentTime", { get: () => currentTime, set: (value: number) => { currentTime = value; target.dispatchEvent(new Event("seeked")); } });
    await expect(seekVideoForThumbnail(target as HTMLVideoElement, 0.5)).resolves.toBeUndefined();
    expect(target.currentTime).toBe(0.5);
  });

  it("exposes only bounded preparation failure codes for development diagnostics", () => {
    expect(capturePreparationFailureCode(new CapturePreparationError("thumbnail-decode", "safe"))).toBe("thumbnail-decode");
    expect(capturePreparationFailureCode(new Error("backend secret"))).toBeNull();
  });
  it("produces a lowercase SHA-256 hex checksum", async () => {
    await expect(sha256Hex(new Blob(["motion"]))).resolves.toBe(
      "305238273bb0fac2a73b43256e38d1515fdf61ec1d30ef161446c3588b93a97b",
    );
  });

  it("produces compatible knee metric series and summary metadata", () => {
    const result = buildKneeMetricSeries(poseDataset());

    expect(result.series.series[0]).toMatchObject({
      metricId: "joint-angle.left-knee.internal.v1",
      unit: "degree",
      values: [90],
    });
    expect(result.summary[0]).toMatchObject({
      activityType: "motion_capture",
      metricDefinitionVersion: "joint-angle-contract.v1",
      side: "left",
      unit: "degree",
    });
  });

  it("excludes unavailable formal samples from numeric series and summaries without substituting zero", () => {
    const pose = poseDataset();
    const unavailable = structuredClone(pose.frames[0]);
    unavailable.frameIndex = 1;
    unavailable.timestamp = 1 / 30;
    unavailable.landmarks3D[25].visibility = 0.1;
    pose.frames.push(unavailable);
    pose.frameCount = 2;
    const result = buildKneeMetricSeries(pose);
    expect(result.series.series[0].values).toEqual([90]);
    expect(result.summary[0]).toMatchObject({ min: 90, max: 90, average: 90, rangeOfMotion: 0 });
    expect(result.series.series[0].values).not.toContain(0);
  });

  it("keeps the recording persistable when no formal angle sample is usable", () => {
    const pose = poseDataset();
    pose.frames[0].landmarks3D.forEach((landmark) => { landmark.visibility = 0.1; });
    const result = buildKneeMetricSeries(pose);
    expect(result.summary).toEqual([]);
    expect(result.series.series).toHaveLength(JOINT_ANGLE_REGISTRY.length);
    expect(result.series.series.every(({ values }) => values.length === 0)).toBe(true);
  });
});

describe("capture publish recovery plan", () => {
  it("creates only before a Record identity is known", () => {
    expect(buildCapturePublishRecoveryPlan({ completedArtifacts: new Set() })).toMatchObject({
      createRecord: true,
      recordId: null,
    });
    expect(buildCapturePublishRecoveryPlan({ recordId: "record-1", completedArtifacts: new Set() })).toMatchObject({
      createRecord: false,
      recordId: "record-1",
    });
  });

  it("preserves completed artifacts and resumes only missing uploads", () => {
    expect(buildCapturePublishRecoveryPlan({
      recordId: "record-1",
      completedArtifacts: new Set(["video", "pose"]),
    }).missingArtifacts).toEqual(["metrics", "thumbnail"]);
  });

  it("retries finalization on the same Record without uploads when all artifacts completed", () => {
    expect(buildCapturePublishRecoveryPlan({
      recordId: "record-1",
      completedArtifacts: new Set(["video", "pose", "metrics", "thumbnail"]),
      lifecycleFailed: true,
    })).toMatchObject({
      createRecord: false,
      missingArtifacts: [],
      retryLifecycle: true,
      recordId: "record-1",
    });
  });

  it("blocks duplicate creation after an ambiguous create outcome", () => {
    expect(buildCapturePublishRecoveryPlan({
      completedArtifacts: new Set(),
      creationOutcomeAmbiguous: true,
    })).toMatchObject({
      createRecord: false,
      duplicateCreationBlocked: true,
    });
  });
});
