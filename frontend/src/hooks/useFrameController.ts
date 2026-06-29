import { useCallback, useState } from "react";
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
    // TODO: Sprint 1+ clamps frame selection to the active media range.
    setFrameState((state) => ({ ...state, currentFrame }));
  }, []);

  const requestNextFrame = useCallback(() => {
    // TODO: Sprint 1+ coordinates frame stepping with playback state.
    setFrameState((state) => ({ ...state, currentFrame: state.currentFrame + 1 }));
  }, []);

  const requestPreviousFrame = useCallback(() => {
    // TODO: Sprint 1+ coordinates frame stepping with playback state.
    setFrameState((state) => ({
      ...state,
      currentFrame: Math.max(0, state.currentFrame - 1),
    }));
  }, []);

  return {
    frameState,
    requestFrame,
    requestNextFrame,
    requestPreviousFrame,
  };
}
