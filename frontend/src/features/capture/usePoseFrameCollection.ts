import { useCallback, useRef, useState } from "react";
import type { PoseDetectionResult, PoseLandmark2D, PoseLandmark3D } from "../../engines/pose";

export type CapturePoseFrame = {
  frameIndex: number;
  timestampMs: number;
  landmarks2D: PoseLandmark2D[];
  landmarks3D: PoseLandmark3D[];
};

function copyLandmarks2D(landmarks: PoseLandmark2D[]) {
  return landmarks.map((landmark) => ({ ...landmark }));
}

function copyLandmarks3D(landmarks: PoseLandmark3D[]) {
  return landmarks.map((landmark) => ({ ...landmark }));
}

function getPoseResultKey(poseResult: PoseDetectionResult) {
  return poseResult.frameIndex ?? poseResult.timestampMs;
}

export function usePoseFrameCollection() {
  const framesRef = useRef<CapturePoseFrame[]>([]);
  const collectedResultKeysRef = useRef(new Set<number>());
  const firstPoseTimestampMsRef = useRef<number | null>(null);
  const nextFrameIndexRef = useRef(0);
  const isCollectingRef = useRef(false);
  const [collectedPoseFrameCount, setCollectedPoseFrameCount] = useState(0);

  const startPoseFrameCollection = useCallback(() => {
    framesRef.current = [];
    collectedResultKeysRef.current = new Set<number>();
    firstPoseTimestampMsRef.current = null;
    nextFrameIndexRef.current = 0;
    isCollectingRef.current = true;
    setCollectedPoseFrameCount(0);
  }, []);

  const stopPoseFrameCollection = useCallback(() => {
    isCollectingRef.current = false;
  }, []);

  const collectPoseFrame = useCallback((poseResult: PoseDetectionResult | null) => {
    if (!isCollectingRef.current || !poseResult || poseResult.landmarks2D.length === 0) {
      return;
    }

    const resultKey = getPoseResultKey(poseResult);

    if (collectedResultKeysRef.current.has(resultKey)) {
      return;
    }

    collectedResultKeysRef.current.add(resultKey);

    if (firstPoseTimestampMsRef.current === null) {
      firstPoseTimestampMsRef.current = poseResult.timestampMs;
    }

    const frame: CapturePoseFrame = {
      frameIndex: nextFrameIndexRef.current,
      timestampMs: Math.max(0, poseResult.timestampMs - firstPoseTimestampMsRef.current),
      landmarks2D: copyLandmarks2D(poseResult.landmarks2D),
      landmarks3D: copyLandmarks3D(poseResult.landmarks3D),
    };

    nextFrameIndexRef.current += 1;
    framesRef.current = [...framesRef.current, frame];
    setCollectedPoseFrameCount(framesRef.current.length);
  }, []);

  return {
    collectedPoseFrameCount,
    collectedPoseFrames: framesRef.current,
    collectPoseFrame,
    startPoseFrameCollection,
    stopPoseFrameCollection,
  };
}
