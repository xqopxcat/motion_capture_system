import { describe, expect, it } from "vitest";
import { createMediaPipePoseEngine } from "./MediaPipePoseEngine";
import {
  MEDIAPIPE_POSE_LANDMARK_COUNT,
  MEDIAPIPE_POSE_LANDMARK_NAMES,
} from "./mediaPipePoseLandmarks";
import { createNoopPoseEngine } from "./noopPoseEngine";
import { normalizeMediaPipePoseResult } from "./normalizeMediaPipePoseResult";
import {
  createMediaPipePoseEngineFromConfig,
  LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG,
} from "./mediaPipeRuntimeConfig";
import type { PoseEngine } from "./PoseEngine";
import type { PoseDetectionInput, PoseDetectionResult } from "./types";

function expectValidCapabilities(engine: PoseEngine) {
  expect(engine.metadata.capabilities).toEqual(
    expect.objectContaining({
      supports2D: expect.any(Boolean),
      supports3D: expect.any(Boolean),
      supportsRealtime: expect.any(Boolean),
      supportsVideoFrame: expect.any(Boolean),
      supportsVisibility: expect.any(Boolean),
      jointCount: expect.any(Number),
      outputSchema: "pose.v1",
    }),
  );
  expect(engine.metadata.capabilities.jointCount).toBeGreaterThan(0);
}

function expectPlatformPoseResult(result: PoseDetectionResult, input: PoseDetectionInput) {
  expect(result).toEqual(
    expect.objectContaining({
      engineName: expect.any(String),
      engineVersion: expect.any(String),
      timestampMs: input.timestampMs,
      landmarks2D: expect.any(Array),
      landmarks3D: expect.any(Array),
    }),
  );
  expect(result.frameIndex).toBe(input.frameIndex);
  expect(result).not.toHaveProperty("landmarks");
  expect(result).not.toHaveProperty("rawResult");
  expect(result).not.toHaveProperty("mediaPipeResult");
}

function createSyntheticInput(timestampMs = 123): PoseDetectionInput {
  return {
    source: {} as HTMLVideoElement,
    timestampMs,
    frameIndex: 7,
  };
}

function describePoseEngineContract(
  name: string,
  createEngine: () => PoseEngine,
  options: {
    canRunDetection: boolean;
  },
) {
  describe(name, () => {
    it("exposes metadata and required capabilities", () => {
      const engine = createEngine();

      expect(engine.metadata.name).toEqual(expect.any(String));
      expect(engine.metadata.version).toEqual(expect.any(String));
      expectValidCapabilities(engine);
    });

    it("exposes initialize, detect, and dispose lifecycle methods", () => {
      const engine = createEngine();

      expect(engine.initialize).toEqual(expect.any(Function));
      expect(engine.detect).toEqual(expect.any(Function));
      expect(engine.dispose).toEqual(expect.any(Function));
    });

    if (options.canRunDetection) {
      it("initializes, detects, and returns the platform pose result shape", async () => {
        const engine = createEngine();
        const input = createSyntheticInput();

        await expect(engine.initialize()).resolves.toBeUndefined();
        const result = await engine.detect(input);

        expectPlatformPoseResult(result, input);
        expect(() => engine.dispose()).not.toThrow();
      });

      it("has explicit detect-after-dispose behavior", async () => {
        const engine = createEngine();
        const input = createSyntheticInput(456);

        await engine.initialize();
        engine.dispose();

        const result = await engine.detect(input);
        expectPlatformPoseResult(result, input);
      });
    }
  });
}

describePoseEngineContract("noop pose engine", createNoopPoseEngine, {
  canRunDetection: true,
});

describe("MediaPipe pose engine adapter contract", () => {
  const createEngine = () =>
    createMediaPipePoseEngine({
      modelAssetPath: "/test-assets/pose_landmarker.task",
      wasmBasePath: "/test-assets/wasm",
    });

  describePoseEngineContract("MediaPipe pose engine static contract", createEngine, {
    canRunDetection: false,
  });

  it("does not require model or wasm loading for factory, metadata, and dispose", () => {
    const engine = createEngine();

    expectValidCapabilities(engine);
    expect(() => engine.dispose()).not.toThrow();
  });

  it("rejects detection before initialization with a contract-safe error", async () => {
    const engine = createEngine();

    await expect(engine.detect(createSyntheticInput())).rejects.toThrow(
      "MediaPipe pose engine must be initialized before detection.",
    );
  });
});

describe("MediaPipe runtime asset config", () => {
  it("centralizes explicit Vite public asset paths", () => {
    expect(LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG).toEqual({
      modelAssetPath: "/models/pose_landmarker.task",
      wasmBasePath: "/mediapipe/wasm",
    });
  });

  it("creates a MediaPipe pose engine from explicit config without loading assets", () => {
    const engine = createMediaPipePoseEngineFromConfig(LOCAL_MEDIAPIPE_RUNTIME_ASSET_CONFIG);

    expect(engine.metadata.name).toBe("mediapipe-pose-landmarker");
    expect(() => engine.dispose()).not.toThrow();
  });
});

describe("MediaPipe pose result normalization", () => {
  it("maps MediaPipe landmarks into platform-owned 2D and 3D landmark shapes", () => {
    const result = normalizeMediaPipePoseResult({
      landmarks: [
        MEDIAPIPE_POSE_LANDMARK_NAMES.map((_, index) => ({
          x: index / 100,
          y: index / 200,
          z: index / 300,
          visibility: 0.9,
        })),
      ],
      worldLandmarks: [
        MEDIAPIPE_POSE_LANDMARK_NAMES.map((_, index) => ({
          x: index,
          y: index + 1,
          z: index + 2,
          visibility: 0.8,
        })),
      ],
    });

    expect(result.landmarks2D).toHaveLength(MEDIAPIPE_POSE_LANDMARK_COUNT);
    expect(result.landmarks3D).toHaveLength(MEDIAPIPE_POSE_LANDMARK_COUNT);
    expect(result.landmarks2D[0]).toEqual({
      id: 0,
      name: "nose",
      x: 0,
      y: 0,
      visibility: 0.9,
    });
    expect(result.landmarks3D[32]).toEqual({
      id: 32,
      name: "right_foot_index",
      x: 32,
      y: 33,
      z: 34,
      visibility: 0.8,
    });
    expect(result).not.toHaveProperty("landmarks");
    expect(result).not.toHaveProperty("worldLandmarks");
  });

  it("returns an empty 3D landmark array when MediaPipe world landmarks are missing", () => {
    const result = normalizeMediaPipePoseResult({
      landmarks: [[{ x: 0.1, y: 0.2, z: 0.3, visibility: 0.4 }]],
    });

    expect(result.landmarks2D).toEqual([
      {
        id: 0,
        name: "nose",
        x: 0.1,
        y: 0.2,
        visibility: 0.4,
      },
    ]);
    expect(result.landmarks3D).toEqual([]);
  });
});
