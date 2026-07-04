export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function getMaxFrameIndex(frameCount: number) {
  if (!Number.isFinite(frameCount) || frameCount <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(frameCount) - 1);
}

export function clampFrameIndex(frameIndex: number, frameCount: number) {
  return Math.round(clampNumber(frameIndex, 0, getMaxFrameIndex(frameCount)));
}

export function clampTime(currentTime: number, duration: number) {
  return clampNumber(currentTime, 0, Math.max(0, duration));
}

export function timeToFrameIndex(currentTime: number, fps: number, frameCount: number) {
  if (!Number.isFinite(fps) || fps <= 0) {
    return 0;
  }

  return clampFrameIndex(Math.floor(currentTime * fps), frameCount);
}

export function frameIndexToTime(frameIndex: number, fps: number, frameCount: number) {
  if (!Number.isFinite(fps) || fps <= 0) {
    return 0;
  }

  return clampFrameIndex(frameIndex, frameCount) / fps;
}
