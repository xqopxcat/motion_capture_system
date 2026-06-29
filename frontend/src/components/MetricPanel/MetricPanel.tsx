import type { MetricDisplayValue } from "../../types";
import styles from "./MetricPanel.module.css";

export type MetricPanelProps = {
  metrics: MetricDisplayValue[];
};

export function MetricPanel({ metrics }: MetricPanelProps) {
  return (
    <section className={styles.panel} aria-label="Metric panel">
      {metrics.length === 0 ? (
        <p className={styles.empty}>No metrics provided.</p>
      ) : (
        <dl className={styles.metricList}>
          {metrics.map((metric) => (
            <div className={styles.metricItem} key={metric.id}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
