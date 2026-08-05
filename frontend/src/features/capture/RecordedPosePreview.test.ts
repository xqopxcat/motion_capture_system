import { describe, expect, it, vi } from "vitest";
import { buildPoseDatasetDraft, type CapturePoseDatasetDraft } from "./buildPoseDatasetDraft";
import {
  MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX,
  recordedPreviewAspectRatio,
  recordedPreviewMaximumWidth,
  resolveRecordedFormalAngles,
} from "./RecordedPosePreview";

describe("Recorded Pose Preview geometry", () => {
  it("uses the recorded video's intrinsic aspect ratio", () => {
    expect(recordedPreviewAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
    expect(recordedPreviewAspectRatio(1280, 960)).toBeCloseTo(4 / 3);
    expect(recordedPreviewAspectRatio(720, 1280)).toBeCloseTo(9 / 16);
  });

  it("uses 16:9 only before valid metadata is available", () => {
    expect(recordedPreviewAspectRatio(0, 0)).toBeCloseTo(16 / 9);
  });

  it("caps display size without changing the recorded aspect ratio", () => {
    expect(recordedPreviewMaximumWidth(4 / 3)).toBeCloseTo(
      MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX * 4 / 3,
    );
    expect(recordedPreviewMaximumWidth(9 / 16)).toBeCloseTo(
      MAXIMUM_RECORDED_PREVIEW_HEIGHT_PX * 9 / 16,
    );
  });
});

function dataset(timestampOffset = 0): CapturePoseDatasetDraft {
  const landmarks2D = Array.from({ length: 33 }, (_, id) => ({ id, name: `joint_${id}`, x: id / 100, y: id / 100, visibility: 1 }));
  const landmarks3D = landmarks2D.map((item) => ({ ...item, z: item.x }));
  return buildPoseDatasetDraft([
    { frameIndex: 0, timestampMs: timestampOffset, landmarks2D, landmarks3D },
    { frameIndex: 1, timestampMs: timestampOffset + 33, landmarks2D, landmarks3D },
  ]);
}

describe("Task 81 one-frame Review formal-angle cache", () => {
  it("computes once for repeated ticks on one frame while allowing repeated redraw inputs", () => {
    const draft = dataset(); const calculate = vi.fn(() => Object.freeze([]));
    const first = resolveRecordedFormalAngles(null, draft, "blob:a", draft.frames[0], calculate);
    const repeated = resolveRecordedFormalAngles(first.cache, draft, "blob:a", draft.frames[0], calculate);
    expect(calculate).toHaveBeenCalledOnce(); expect(first.computed).toBe(true); expect(repeated.computed).toBe(false); expect(repeated.results).toBe(first.results);
  });

  it("recalculates once for forward and backward frame changes with a bounded single entry", () => {
    const draft = dataset(); const calculate = vi.fn(() => Object.freeze([]));
    const first = resolveRecordedFormalAngles(null, draft, "blob:a", draft.frames[0], calculate);
    const forward = resolveRecordedFormalAngles(first.cache, draft, "blob:a", draft.frames[1], calculate);
    const repeatForward = resolveRecordedFormalAngles(forward.cache, draft, "blob:a", draft.frames[1], calculate);
    const backward = resolveRecordedFormalAngles(repeatForward.cache, draft, "blob:a", draft.frames[0], calculate);
    expect(calculate).toHaveBeenCalledTimes(3); expect(repeatForward.computed).toBe(false); expect(backward.computed).toBe(true);
    expect(Object.keys(backward.cache!)).toEqual(["dataset", "videoUrl", "profileKey", "frameIndex", "timestampMs", "results"]);
  });

  it("invalidates for dataset, video URL, or missing frame and never returns stale results", () => {
    const firstDraft = dataset(); const secondDraft = dataset(100); const calculate = vi.fn(() => Object.freeze([]));
    const first = resolveRecordedFormalAngles(null, firstDraft, "blob:a", firstDraft.frames[0], calculate);
    const changedDataset = resolveRecordedFormalAngles(first.cache, secondDraft, "blob:a", secondDraft.frames[0], calculate);
    const changedVideo = resolveRecordedFormalAngles(changedDataset.cache, secondDraft, "blob:b", secondDraft.frames[0], calculate);
    const missing = resolveRecordedFormalAngles(changedVideo.cache, secondDraft, "blob:b", null, calculate);
    expect(calculate).toHaveBeenCalledTimes(3); expect(changedDataset.computed).toBe(true); expect(changedVideo.computed).toBe(true);
    expect(missing).toEqual({ cache: null, results: null, computed: false });
  });
});
