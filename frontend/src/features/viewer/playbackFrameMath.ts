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

export function timestampToFrameIndex(currentTime: number, timestamps: number[]) {
  if (timestamps.length === 0) {
    return 0;
  }

  const time = Math.max(0, Number.isFinite(currentTime) ? currentTime : 0);
  let low = 0;
  let high = timestamps.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (timestamps[middle] < time) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  if (low === 0) {
    return 0;
  }

  const previous = low - 1;
  return time - timestamps[previous] <= timestamps[low] - time ? previous : low;
}

export function frameTimestamp(frameIndex: number, timestamps: number[]) {
  if (timestamps.length === 0) {
    return 0;
  }

  return timestamps[clampFrameIndex(frameIndex, timestamps.length)] ?? 0;
}
