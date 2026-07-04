import { useCallback, useState } from "react";
import {
  clampFrameIndex,
  clampTime,
  frameIndexToTime,
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
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    ...initialPlaybackState,
    ...initialState,
  });
  const [frameState, setFrameState] = useState<FrameState>({
    ...initialFrameState,
    ...initialState,
  });

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
        currentFrame: timeToFrameIndex(currentTime, frame.fps, frame.totalFrames),
      }));

      return {
        ...playback,
        currentTime,
      };
    });
  }, []);

  const requestSeekFrame = useCallback((requestedFrame: number) => {
    setFrameState((frame) => {
      const currentFrame = clampFrameIndex(requestedFrame, frame.totalFrames);

      setPlaybackState((playback) => ({
        ...playback,
        currentTime: clampTime(
          frameIndexToTime(currentFrame, frame.fps, frame.totalFrames),
          playback.duration,
        ),
      }));

      return {
        ...frame,
        currentFrame,
      };
    });
  }, []);

  const requestNextFrame = useCallback(() => {
    setFrameState((frame) => {
      const currentFrame = clampFrameIndex(frame.currentFrame + 1, frame.totalFrames);

      setPlaybackState((playback) => ({
        ...playback,
        currentTime: clampTime(
          frameIndexToTime(currentFrame, frame.fps, frame.totalFrames),
          playback.duration,
        ),
      }));

      return {
        ...frame,
        currentFrame,
      };
    });
  }, []);

  const requestPreviousFrame = useCallback(() => {
    setFrameState((frame) => {
      const currentFrame = clampFrameIndex(frame.currentFrame - 1, frame.totalFrames);

      setPlaybackState((playback) => ({
        ...playback,
        currentTime: clampTime(
          frameIndexToTime(currentFrame, frame.fps, frame.totalFrames),
          playback.duration,
        ),
      }));

      return {
        ...frame,
        currentFrame,
      };
    });
  }, []);

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
        currentFrame: timeToFrameIndex(currentTime, frame.fps, frame.totalFrames),
      }));

      return {
        ...playback,
        currentTime,
      };
    });
  }, []);

  const handleVideoDurationChange = useCallback((duration: number) => {
    setPlaybackState((playback) => {
      const nextDuration = Math.max(0, Number.isFinite(duration) ? duration : 0);
      const currentTime = clampTime(playback.currentTime, nextDuration);

      setFrameState((frame) => ({
        ...frame,
        currentFrame: timeToFrameIndex(currentTime, frame.fps, frame.totalFrames),
      }));

      return {
        ...playback,
        currentTime,
        duration: nextDuration,
      };
    });
  }, []);

  const handleVideoEnded = useCallback(() => {
    setPlaybackState((state) => ({ ...state, isPlaying: false }));
  }, []);

  const setPlaybackBounds = useCallback(
    (bounds: Partial<FrameState & Pick<PlaybackState, "duration">>) => {
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
