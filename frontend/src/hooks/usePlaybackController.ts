import { useCallback, useState } from "react";
import type { PlaybackState } from "../types";

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
};

export function usePlaybackController(initialState: Partial<PlaybackState> = {}) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    ...initialPlaybackState,
    ...initialState,
  });

  const requestPlay = useCallback(() => {
    // TODO: Sprint 1+ connects this intent to a controlled VideoPlayer.
    setPlaybackState((state) => ({ ...state, isPlaying: true }));
  }, []);

  const requestPause = useCallback(() => {
    // TODO: Sprint 1+ connects this intent to a controlled VideoPlayer.
    setPlaybackState((state) => ({ ...state, isPlaying: false }));
  }, []);

  const requestSeekTime = useCallback((currentTime: number) => {
    // TODO: Sprint 1+ validates seek bounds against loaded media metadata.
    setPlaybackState((state) => ({ ...state, currentTime }));
  }, []);

  const requestPlaybackSpeed = useCallback((playbackSpeed: number) => {
    // TODO: Sprint 1+ validates supported playback speed values.
    setPlaybackState((state) => ({ ...state, playbackSpeed }));
  }, []);

  return {
    playbackState,
    requestPause,
    requestPlay,
    requestPlaybackSpeed,
    requestSeekTime,
  };
}
