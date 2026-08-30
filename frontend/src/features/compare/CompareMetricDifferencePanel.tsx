import { useMemo } from "react";
import type { PoseDataset } from "../../types";
import styles from "./CompareMetricDifferencePanel.module.css";
import {
  buildPoseFrameMetricDifferenceRows,
  formatCompareMetricValue,
} from "./compareMetricDifference";

export type CompareMetricDifferencePanelProps = {
  leftFrame: number;
  leftPoseDataset: PoseDataset | null;
  rightFrame: number;
  rightPoseDataset: PoseDataset | null;
};

export function CompareMetricDifferencePanel({
  leftFrame,
  leftPoseDataset,
  rightFrame,
  rightPoseDataset,
}: CompareMetricDifferencePanelProps) {
  const rows = useMemo(() => buildPoseFrameMetricDifferenceRows({
    leftFrame,
    leftPoseDataset,
    rightFrame,
    rightPoseDataset,
  }), [leftFrame, leftPoseDataset, rightFrame, rightPoseDataset]);

  return (
    <section className={styles.panel} aria-label="Basic metric difference">
      <header className={styles.header}>
        <div>
          <h2>Basic metric difference</h2>
          <p>Frame-aligned formal angles from pose.v1. Difference: right minus left.</p>
        </div>
        <span>
          Left frame {leftFrame} / Right frame {rightFrame}
        </span>
      </header>

      {rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Left</th>
                <th>Right</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.metricId}>
                  <th scope="row">{row.label}</th>
                  <td>{formatCompareMetricValue(row.leftValue, row.unit)}</td>
                  <td>{formatCompareMetricValue(row.rightValue, row.unit)}</td>
                  <td>{formatCompareMetricValue(row.difference, row.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
