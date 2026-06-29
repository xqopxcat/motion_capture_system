import styles from "./ComparePanel.module.css";

export type ComparePanelProps = {
  leftRecordTitle?: string;
  rightRecordTitle?: string;
  syncOffsetFrames: number;
  onSyncOffsetIntent?: (syncOffsetFrames: number) => void;
};

export function ComparePanel({
  leftRecordTitle = "Left record",
  rightRecordTitle = "Right record",
  syncOffsetFrames,
  onSyncOffsetIntent,
}: ComparePanelProps) {
  return (
    <section className={styles.panel} aria-label="Compare panel">
      <div className={styles.records}>
        <span>{leftRecordTitle}</span>
        <span>{rightRecordTitle}</span>
      </div>
      <label className={styles.offsetControl}>
        Sync offset frames
        <input
          type="number"
          value={syncOffsetFrames}
          onChange={(event) => onSyncOffsetIntent?.(Number(event.target.value))}
        />
      </label>
    </section>
  );
}
