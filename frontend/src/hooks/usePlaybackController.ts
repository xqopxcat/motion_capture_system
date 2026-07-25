import { useCallback, useRef, useState } from "react";
import {
  clampFrameIndex,
  clampTime,
  frameTimestamp,
  frameIndexToTime,
  timestampToFrameIndex,
  timeToFrameIndex,
} from "../features/viewer/playbackFrameMath";
import type { FrameState, PlaybackState } from "../types";

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
};

const initialFrameState: FrameState = {
  currentFrame: 0,
  fps: 30,
  totalFrames: 0,
};

export type PlaybackControllerInitialState = Partial<PlaybackState & FrameState>;

export function usePlaybackController(initialState: PlaybackControllerInitialState = {}) {
  const frameTimestampsRef = useRef<number[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    ...initialPlaybackState,
    ...initialState,
  });
  const [frameState, setFrameState] = useState<FrameState>({
    ...initialFrameState,
    ...initialState,
  });

  const timeToCurrentFrame = useCallback((time: number, fps: number, totalFrames: number) => {
    return frameTimestampsRef.current.length > 0
      ? timestampToFrameIndex(time, frameTimestampsRef.current)
      : timeToFrameIndex(time, fps, totalFrames);
  }, []);

  const currentFrameToTime = useCallback((frameIndex: number, fps: number, totalFrames: number) => {
    return frameTimestampsRef.current.length > 0
      ? frameTimestamp(frameIndex, frameTimestampsRef.current)
      : frameIndexToTime(frameIndex, fps, totalFrames);
  }, []);

  const requestPlay = useCallback(() => {
    setPlaybackState((state) => ({ ...state, isPlaying: true }));
  }, []);

  const requestPause = useCallback(() => {
    setPlaybackState((state) => ({ ...state, isPlaying: false }));
  }, []);

  const requestTogglePlay = useCallback(() => {
    setPlaybackState((state) => ({ ...state, isPlaying: !state.isPlaying }));
  }, []);

  const requestSeekTime = useCallback((requestedTime: number) => {
    setPlaybackState((playback) => {
      const currentTime = clampTime(requestedTime, playback.duration);

      setFrameState((frame) => ({
        ...frame,
        currentFrame: timeToCurrentFrame(currentTime, frame.fps, frame.totalFrames),
      }));

      return {
        ...playback,
        currentTime,
      };
    });
  }, [timeToCurrentFrame]);

  const requestSeekFrame = useCallback((requestedFrame: number) => {
    setFrameState((frame) => {
      const currentFrame = clampFrameIndex(requestedFrame, frame.totalFrames);

      setPlaybackState((playback) => ({
        ...playback,
        currentTime: clampTime(
          currentFrameToTime(currentFrame, frame.fps, frame.totalFrames),
          playback.duration,
        ),
      }));

      return {
        ...frame,
        currentFrame,
      };
    });
  }, [currentFrameToTime]);

  const requestNextFrame = useCallback(() => {
    setFrameState((frame) => {
      const currentFrame = clampFrameIndex(frame.currentFrame + 1, frame.totalFrames);

      setPlaybackState((playback) => ({
        ...playback,
        currentTime: clampTime(
          currentFrameToTime(currentFrame, frame.fps, frame.totalFrames),
          playback.duration,
        ),
      }));

      return {
        ...frame,
        currentFrame,
      };
    });
  }, [currentFrameToTime]);

  const requestPreviousFrame = useCallback(() => {
    setFrameState((frame) => {
      const currentFrame = clampFrameIndex(frame.currentFrame - 1, frame.totalFrames);

      setPlaybackState((playback) => ({
        ...playback,
        currentTime: clampTime(
          currentFrameToTime(currentFrame, frame.fps, frame.totalFrames),
          playback.duration,
        ),
      }));

      return {
        ...frame,
        currentFrame,
      };
    });
  }, [currentFrameToTime]);

  const requestPlaybackSpeed = useCallback((playbackSpeed: number) => {
    if (!Number.isFinite(playbackSpeed) || playbackSpeed <= 0) {
      return;
    }

    setPlaybackState((state) => ({ ...state, playbackSpeed }));
  }, []);

  const handleVideoTimeUpdate = useCallback((time: number) => {
    setPlaybackState((playback) => {
      const currentTime = clampTime(time, playback.duration);

      setFrameState((frame) => ({
        ...frame,
        currentFrame: timeToCurrentFrame(currentTime, frame.fps, frame.totalFrames),
      }));

      return {
        ...playback,
        currentTime,
      };
    });
  }, [timeToCurrentFrame]);

  const handleVideoDurationChange = useCallback((duration: number) => {
    setPlaybackState((playback) => {
      const nextDuration = Math.max(0, Number.isFinite(duration) ? duration : 0);
      const currentTime = clampTime(playback.currentTime, nextDuration);

      setFrameState((frame) => ({
        ...frame,
        currentFrame: timeToCurrentFrame(currentTime, frame.fps, frame.totalFrames),
      }));

      return {
        ...playback,
        currentTime,
        duration: nextDuration,
      };
    });
  }, [timeToCurrentFrame]);

  const handleVideoEnded = useCallback(() => {
    setPlaybackState((state) => ({ ...state, isPlaying: false }));
  }, []);

  const setPlaybackBounds = useCallback(
    (
      bounds: Partial<FrameState & Pick<PlaybackState, "duration">> & {
        frameTimestamps?: number[];
      },
    ) => {
      if (bounds.frameTimestamps) {
        frameTimestampsRef.current = bounds.frameTimestamps;
      }
      setFrameState((frame) => {
        const fps = bounds.fps ?? frame.fps;
        const totalFrames = bounds.totalFrames ?? frame.totalFrames;
        const currentFrame = clampFrameIndex(frame.currentFrame, totalFrames);

        return {
          ...frame,
          currentFrame,
          fps,
          totalFrames,
        };
      });

      setPlaybackState((playback) => {
        const duration = bounds.duration ?? playback.duration;

        return {
          ...playback,
          currentTime: clampTime(playback.currentTime, duration),
          duration,
        };
      });
    },
    [],
  );

  return {
    frameState,
    handleVideoDurationChange,
    handleVideoEnded,
    handleVideoTimeUpdate,
    playbackState,
    requestNextFrame,
    requestPause,
    requestPlaybackSpeed,
    requestPlay,
    requestPreviousFrame,
    requestSeekFrame,
    requestSeekTime,
    requestTogglePlay,
    setPlaybackBounds,
  };
}
