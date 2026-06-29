import styles from "./PlaybackControls.module.css";

export type PlaybackControlsProps = {
  isPlaying: boolean;
  playbackSpeed: number;
  onNextFrame?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  onPreviousFrame?: () => void;
  onPlaybackSpeedChange?: (playbackSpeed: number) => void;
};

export function PlaybackControls({
  isPlaying,
  playbackSpeed,
  onNextFrame,
  onPause,
  onPlay,
  onPreviousFrame,
  onPlaybackSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className={styles.controls} aria-label="Playback controls">
      <button type="button" onClick={onPreviousFrame}>
        Previous Frame
      </button>
      <button type="button" onClick={isPlaying ? onPause : onPlay}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button type="button" onClick={onNextFrame}>
        Next Frame
      </button>
      <label className={styles.speedControl}>
        Speed
        <select
          value={playbackSpeed}
          onChange={(event) => onPlaybackSpeedChange?.(Number(event.target.value))}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </label>
    </div>
  );
}
