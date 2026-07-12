import styles from "./CompareMetricDifferencePanel.module.css";
import {
  buildCompareMetricDifferenceRows,
  formatCompareMetricValue,
} from "./compareMetricDifference";

export type CompareMetricDifferencePanelProps = {
  leftFrame: number;
  leftMetricSeries: unknown;
  rightFrame: number;
  rightMetricSeries: unknown;
};

export function CompareMetricDifferencePanel({
  leftFrame,
  leftMetricSeries,
  rightFrame,
  rightMetricSeries,
}: CompareMetricDifferencePanelProps) {
  const rows = buildCompareMetricDifferenceRows({
    leftFrame,
    leftMetricSeries,
    rightFrame,
    rightMetricSeries,
  });

  return (
    <section className={styles.panel} aria-label="Basic metric difference">
      <header className={styles.header}>
        <div>
          <h2>Basic metric difference</h2>
          <p>Difference convention: right value minus left value.</p>
        </div>
        <span>
          Left frame {leftFrame} / Right frame {rightFrame}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className={styles.empty}>No comparable Metric Series values are available.</p>
      ) : (
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
