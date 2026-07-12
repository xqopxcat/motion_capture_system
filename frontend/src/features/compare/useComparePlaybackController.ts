import { useCallback, useEffect, useState } from "react";
import { usePlaybackController } from "../../hooks";
import { clampFrameIndex } from "../viewer/playbackFrameMath";

export type UseComparePlaybackControllerInput = {
  leftDuration?: number;
  leftFps?: number;
  leftFrameCount?: number;
  rightDuration?: number;
  rightFps?: number;
  rightFrameCount?: number;
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

export function useComparePlaybackController(input: UseComparePlaybackControllerInput) {
  const controller = usePlaybackController();
  const [syncOffsetFrames, setSyncOffsetFrames] = useState(0);
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
    setPlaybackBounds(bounds);
  }, [bounds.duration, bounds.fps, bounds.totalFrames, setPlaybackBounds]);

  const requestJumpFrames = useCallback(
    (frameDelta: number) => {
      requestSeekFrame(frameState.currentFrame + frameDelta);
    },
    [frameState.currentFrame, requestSeekFrame],
  );
  const requestSyncOffsetDelta = useCallback((frameDelta: number) => {
    setSyncOffsetFrames((currentOffset) => currentOffset + frameDelta);
  }, []);
  const requestSyncOffsetReset = useCallback(() => {
    setSyncOffsetFrames(0);
  }, []);
  const frameMapping = mapCompareSyncFrames({
    leftFrameCount: input.leftFrameCount,
    rightFrameCount: input.rightFrameCount,
    sharedFrame: frameState.currentFrame,
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
