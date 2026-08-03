import { describe, expect, expectTypeOf, it } from "vitest";
import { MEDIAPIPE_POSE_LANDMARK_COUNT } from "./mediaPipePoseLandmarks";
import { mapPoseDetectionResultToRawCanonicalPose } from "./rawCanonicalPose";
import { createRuntimePoseQualityEngine, RUNTIME_POSE_AUTHORITY } from "./runtimePoseQuality";
import { STABILIZED_RUNTIME_POSE_PROFILE } from "./stabilizationProfile";
import type {
  FilteredRuntimePose,
  PoseDetectionResult,
  RawCanonicalPose,
} from "./types";
import type { CaptureSkeletonOverlayProps } from "../../features/capture/CaptureSkeletonOverlay";
import type { RawPoseCollector } from "../../features/capture/usePoseFrameCollection";
import { buildPoseDatasetV1 } from "../../features/capture/poseDatasetV1";
import { buildKneeMetricSeries } from "../../features/capture/publishCaptureRecord";
import { DEFAULT_SPRINT_7_QUALITY_POLICY } from "../poseQuality";

function providerResult(): PoseDetectionResult {
  return {
    engineName: "test-engine",
    engineVersion: "1.2.3",
    timestampMs: 999,
    frameIndex: 7,
    landmarks2D: Array.from({ length: MEDIAPIPE_POSE_LANDMARK_COUNT }, (_, id) => ({
      id,
      name: `joint_${id}`,
      x: id / 100,
      y: id / 200,
      visibility: 0.9,
    })),
    landmarks3D: Array.from({ length: MEDIAPIPE_POSE_LANDMARK_COUNT }, (_, id) => ({
      id,
      name: `joint_${id}`,
      x: id,
      y: id + 1,
      z: id + 2,
      visibility: 0.8,
    })),
  };
}

function rawPose() {
  return mapPoseDetectionResultToRawCanonicalPose(providerResult(), {
    sourceTimestampMs: 456,
    frameIndex: 7,
    cameraSessionId: 3,
  });
}

describe("Task 76 Raw Canonical Pose", () => {
  it("owns provider data and preserves the complete source identity", () => {
    const provider = providerResult();
    const raw = mapPoseDetectionResultToRawCanonicalPose(provider, {
      sourceTimestampMs: 456,
      frameIndex: 7,
      cameraSessionId: 3,
    });

    expect(raw).toMatchObject({
      engineName: "test-engine",
      engineVersion: "1.2.3",
      timestampMs: 456,
      frameIndex: 7,
      cameraSessionId: 3,
    });
    expect(raw.landmarks2D).toHaveLength(33);
    expect(raw.landmarks3D).toHaveLength(33);
    expect(raw.landmarks2D.map(({ id }) => id)).toEqual(Array.from({ length: 33 }, (_, id) => id));
    expect(raw.landmarks2D[12].visibility).toBe(0.9);
    expect(raw.landmarks3D[12]).toMatchObject({ x: 12, y: 13, z: 14, visibility: 0.8 });
    expect(raw.landmarks2D).not.toBe(provider.landmarks2D);
    expect(raw.landmarks2D[0]).not.toBe(provider.landmarks2D[0]);
    expect(raw.landmarks3D).not.toBe(provider.landmarks3D);

    provider.landmarks2D[0].x = 99;
    provider.landmarks3D[0].z = 99;
    expect(raw.landmarks2D[0].x).toBe(0);
    expect(raw.landmarks3D[0].z).toBe(2);
    expect(raw).not.toHaveProperty("runtimeProfileId");
  });

  it("rejects malformed identity, landmark counts, and nonfinite coordinates", () => {
    const malformed = providerResult();
    malformed.landmarks2D.pop();
    expect(() => mapPoseDetectionResultToRawCanonicalPose(malformed, { sourceTimestampMs: 1 }))
      .toThrow("exactly 33");
    const nonfinite = providerResult();
    nonfinite.landmarks2D[0].x = Number.NaN;
    expect(() => mapPoseDetectionResultToRawCanonicalPose(nonfinite, { sourceTimestampMs: 1 }))
      .toThrow("must be finite");
    expect(() => mapPoseDetectionResultToRawCanonicalPose(providerResult(), { sourceTimestampMs: -1 }))
      .toThrow("source timestamp");
  });

  it("preserves optional absence of world landmarks and frame identity", () => {
    const provider = providerResult();
    provider.landmarks3D = [];
    const raw = mapPoseDetectionResultToRawCanonicalPose(provider, { sourceTimestampMs: 12 });
    const filtered = createRuntimePoseQualityEngine().transform(raw)!;
    expect(raw.frameIndex).toBeUndefined();
    expect(raw.landmarks3D).toEqual([]);
    expect(filtered.frameIndex).toBeUndefined();
    expect(filtered.landmarks3D).toEqual([]);
  });
});

describe("Task 76 Raw / Filtered runtime Pose quality boundary", () => {
  it("creates an independent Filtered Runtime Pose with equal values", () => {
    const raw = rawPose();
    const filtered = createRuntimePoseQualityEngine().transform(raw)!;

    expect(filtered).toMatchObject({
      timestampMs: raw.timestampMs,
      frameIndex: raw.frameIndex,
      cameraSessionId: raw.cameraSessionId,
      engineName: raw.engineName,
      engineVersion: raw.engineVersion,
      runtimeProfileId: STABILIZED_RUNTIME_POSE_PROFILE.id,
    });
    expect(filtered.landmarks2D).toEqual(raw.landmarks2D);
    expect(filtered.landmarks3D).toEqual(raw.landmarks3D);
    expect(filtered.landmarks2D).not.toBe(raw.landmarks2D);
    expect(filtered.landmarks2D[0]).not.toBe(raw.landmarks2D[0]);
    expect(filtered.landmarks3D).not.toBe(raw.landmarks3D);
    expect(filtered.landmarks3D[0]).not.toBe(raw.landmarks3D[0]);
    expect(RUNTIME_POSE_AUTHORITY).toEqual({ authoritative: false, runtimeOnly: true, persist: false });
    expect(DEFAULT_SPRINT_7_QUALITY_POLICY.authority.filteredRuntimePose).toMatchObject({
      boundaryImplemented: true,
      stabilizationImplemented: true,
    });
  });

  it("isolates mutation of a test copy and handles unavailable input deterministically", () => {
    const raw = rawPose();
    const engine = createRuntimePoseQualityEngine();
    const filtered = engine.transform(raw)!;
    const mutableFilteredCopy = {
      landmarks2D: filtered.landmarks2D.map((landmark) => landmark ? { ...landmark } : null),
      landmarks3D: filtered.landmarks3D.map((landmark) => landmark ? { ...landmark } : null),
    };
    mutableFilteredCopy.landmarks2D[0]!.x = 123;
    mutableFilteredCopy.landmarks3D[0]!.z = 456;
    expect(raw.landmarks2D[0].x).toBe(0);
    expect(raw.landmarks3D[0].z).toBe(2);
    expect(engine.transform(null)).toBeNull();
    const empty = mapPoseDetectionResultToRawCanonicalPose(
      { ...providerResult(), landmarks2D: [], landmarks3D: [] },
      { sourceTimestampMs: 1 },
    );
    expect(engine.transform(empty)).toBeNull();
  });

  it("keeps Raw and Filtered nominally incompatible", () => {
    expectTypeOf<RawCanonicalPose>().not.toMatchTypeOf<FilteredRuntimePose>();
    expectTypeOf<FilteredRuntimePose>().not.toMatchTypeOf<RawCanonicalPose>();
    expectTypeOf<CaptureSkeletonOverlayProps["poseResult"]>().toEqualTypeOf<FilteredRuntimePose | null>();
    expectTypeOf<Parameters<RawPoseCollector>[0]>().toEqualTypeOf<RawCanonicalPose | null>();
    expectTypeOf<Parameters<RawPoseCollector>[0]>().not.toMatchTypeOf<FilteredRuntimePose>();
    expectTypeOf<FilteredRuntimePose>().not.toMatchTypeOf<Parameters<typeof buildPoseDatasetV1>[0]>();
    expectTypeOf<FilteredRuntimePose>().not.toMatchTypeOf<Parameters<typeof buildKneeMetricSeries>[0]>();
  });
});
