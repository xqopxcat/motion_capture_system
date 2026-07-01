import type { PoseLandmark2D, PoseLandmark3D } from "../../engines/pose";
import type { CapturePoseFrame } from "./usePoseFrameCollection";

export type CapturePoseDatasetDraftFrame = {
  frameIndex: number;
  timestampMs: number;
  landmarks2D: PoseLandmark2D[];
  landmarks3D: PoseLandmark3D[];
};

export type CapturePoseDatasetDraft = {
  schemaVersion: "pose.v1";
  source: {
    type: "capture";
  };
  metadata: {
    frameCount: number;
    durationMs: number;
    jointCount: number;
    has2D: boolean;
    has3D: boolean;
  };
  frames: CapturePoseDatasetDraftFrame[];
};

export type CapturePoseDatasetSummary = CapturePoseDatasetDraft["metadata"];

function copyLandmarks2D(landmarks: PoseLandmark2D[]) {
  return landmarks.map((landmark) => ({ ...landmark }));
}

function copyLandmarks3D(landmarks: PoseLandmark3D[]) {
  return landmarks.map((landmark) => ({ ...landmark }));
}

export function buildPoseDatasetDraft(frames: CapturePoseFrame[]): CapturePoseDatasetDraft {
  const draftFrames = frames.map((frame) => ({
    frameIndex: frame.frameIndex,
    timestampMs: frame.timestampMs,
    landmarks2D: copyLandmarks2D(frame.landmarks2D),
    landmarks3D: copyLandmarks3D(frame.landmarks3D),
  }));
  const lastFrame = draftFrames[draftFrames.length - 1];
  const firstFrameWith2D = draftFrames.find((frame) => frame.landmarks2D.length > 0);
  const firstFrameWith3D = draftFrames.find((frame) => frame.landmarks3D.length > 0);

  return {
    schemaVersion: "pose.v1",
    source: {
      type: "capture",
    },
    metadata: {
      frameCount: draftFrames.length,
      durationMs: lastFrame?.timestampMs ?? 0,
      jointCount: firstFrameWith2D?.landmarks2D.length ?? firstFrameWith3D?.landmarks3D.length ?? 0,
      has2D: Boolean(firstFrameWith2D),
      has3D: Boolean(firstFrameWith3D),
    },
    frames: draftFrames,
  };
}
