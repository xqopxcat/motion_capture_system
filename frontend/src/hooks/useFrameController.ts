import { useCallback, useState } from "react";
import { clampFrameIndex } from "../features/viewer/playbackFrameMath";
import type { FrameState } from "../types";

const initialFrameState: FrameState = {
  currentFrame: 0,
  totalFrames: 0,
  fps: 30,
};

export function useFrameController(initialState: Partial<FrameState> = {}) {
  const [frameState, setFrameState] = useState<FrameState>({
    ...initialFrameState,
    ...initialState,
  });

  const requestFrame = useCallback((currentFrame: number) => {
    setFrameState((state) => ({
      ...state,
      currentFrame: clampFrameIndex(currentFrame, state.totalFrames),
    }));
  }, []);

  const requestNextFrame = useCallback(() => {
    setFrameState((state) => ({
      ...state,
      currentFrame: clampFrameIndex(state.currentFrame + 1, state.totalFrames),
    }));
  }, []);

  const requestPreviousFrame = useCallback(() => {
    setFrameState((state) => ({
      ...state,
      currentFrame: clampFrameIndex(state.currentFrame - 1, state.totalFrames),
    }));
  }, []);

  return {
    frameState,
    requestFrame,
    requestNextFrame,
    requestPreviousFrame,
  };
}
