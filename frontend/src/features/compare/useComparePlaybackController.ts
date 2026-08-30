import { useCallback, useEffect, useState } from "react";
import { usePlaybackController } from "../../hooks";
import { clampFrameIndex, timestampToFrameIndex } from "../viewer/playbackFrameMath";

export const DEFAULT_COMPARE_SYNC_OFFSET_FRAMES = 0;

export type UseComparePlaybackControllerInput = {
  leftDuration?: number;
  leftFps?: number;
  leftFrameCount?: number;
  rightDuration?: number;
  rightFps?: number;
  rightFrameCount?: number;
  leftFrameTimestamps?: number[];
  rightFrameTimestamps?: number[];
};

function getSafePositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function getSharedFrameCount(leftFrameCount?: number, rightFrameCount?: number) {
  const safeLeftFrameCount = getSafePositiveNumber(leftFrameCount, 0);
  const safeRightFrameCount = getSafePositiveNumber(rightFrameCount, 0);

  if (safeLeftFrameCount > 0 && safeRightFrameCount > 0) {
    return Math.min(safeLeftFrameCount, safeRightFrameCount);
  }

  return Math.max(safeLeftFrameCount, safeRightFrameCount);
}

export function deriveComparePlaybackBounds({
  leftDuration,
  leftFps,
  leftFrameCount,
  rightDuration,
  rightFps,
  rightFrameCount,
}: UseComparePlaybackControllerInput) {
  const totalFrames = getSharedFrameCount(leftFrameCount, rightFrameCount);
  const fps = Math.min(getSafePositiveNumber(leftFps, 30), getSafePositiveNumber(rightFps, 30));
  const safeLeftDuration = getSafePositiveNumber(leftDuration, 0);
  const safeRightDuration = getSafePositiveNumber(rightDuration, 0);
  const duration =
    safeLeftDuration > 0 && safeRightDuration > 0
      ? Math.min(safeLeftDuration, safeRightDuration)
      : Math.max(safeLeftDuration, safeRightDuration);

  return {
    duration,
    fps,
    totalFrames,
  };
}

export type CompareSyncFrameMappingInput = {
  leftFrameCount?: number;
  rightFrameCount?: number;
  sharedFrame: number;
  syncOffsetFrames: number;
};

export function mapCompareSyncFrames({
  leftFrameCount = 0,
  rightFrameCount = 0,
  sharedFrame,
  syncOffsetFrames,
}: CompareSyncFrameMappingInput) {
  return {
    leftFrame: clampFrameIndex(sharedFrame, leftFrameCount),
    rightFrame: clampFrameIndex(sharedFrame + syncOffsetFrames, rightFrameCount),
  };
}

export function mapCompareSyncFramesByTime({
  currentTime,
  leftFrameTimestamps = [],
  rightFrameTimestamps = [],
  syncOffsetFrames,
}: {
  currentTime: number;
  leftFrameTimestamps?: number[];
  rightFrameTimestamps?: number[];
  syncOffsetFrames: number;
}) {
  const leftFrame = timestampToFrameIndex(currentTime, leftFrameTimestamps);
  const rightBaseFrame = timestampToFrameIndex(currentTime, rightFrameTimestamps);
  return {
    leftFrame: clampFrameIndex(leftFrame, leftFrameTimestamps.length),
    rightFrame: clampFrameIndex(rightBaseFrame + syncOffsetFrames, rightFrameTimestamps.length),
  };
}

export function applyCompareSyncOffsetDelta(currentOffset: number, frameDelta: number) {
  return currentOffset + frameDelta;
}

export function resetCompareSyncOffset() {
  return DEFAULT_COMPARE_SYNC_OFFSET_FRAMES;
}

export function useComparePlaybackController(input: UseComparePlaybackControllerInput) {
  const controller = usePlaybackController();
  const [syncOffsetFrames, setSyncOffsetFrames] = useState(DEFAULT_COMPARE_SYNC_OFFSET_FRAMES);
  const bounds = deriveComparePlaybackBounds(input);
  const {
    frameState,
    requestNextFrame,
    requestPreviousFrame,
    requestSeekFrame,
    requestTogglePlay,
    setPlaybackBounds,
  } = controller;

  useEffect(() => {
    setPlaybackBounds({ ...bounds, frameTimestamps: input.leftFrameTimestamps });
  }, [bounds.duration, bounds.fps, bounds.totalFrames, input.leftFrameTimestamps, setPlaybackBounds]);

  const requestJumpFrames = useCallback(
    (frameDelta: number) => {
      requestSeekFrame(frameState.currentFrame + frameDelta);
    },
    [frameState.currentFrame, requestSeekFrame],
  );
  const requestSyncOffsetDelta = useCallback((frameDelta: number) => {
    setSyncOffsetFrames((currentOffset) => applyCompareSyncOffsetDelta(currentOffset, frameDelta));
  }, []);
  const requestSyncOffsetReset = useCallback(() => {
    setSyncOffsetFrames(resetCompareSyncOffset());
  }, []);
  const frameMapping = mapCompareSyncFramesByTime({
    currentTime: controller.playbackState.currentTime,
    leftFrameTimestamps: input.leftFrameTimestamps,
    rightFrameTimestamps: input.rightFrameTimestamps,
    syncOffsetFrames,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        requestTogglePlay();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (event.shiftKey) {
          requestJumpFrames(-10);
          return;
        }

        requestPreviousFrame();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (event.shiftKey) {
          requestJumpFrames(10);
          return;
        }

        requestNextFrame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestJumpFrames, requestNextFrame, requestPreviousFrame, requestTogglePlay]);

  return {
    ...controller,
    frameMapping,
    requestJumpFrames,
    requestSyncOffsetDelta,
    requestSyncOffsetReset,
    sharedBounds: bounds,
    syncOffsetFrames,
  };
}
