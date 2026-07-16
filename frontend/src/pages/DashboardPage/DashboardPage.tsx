import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DASHBOARD_QUICK_ACTIONS,
  buildDashboardTrendChartModel,
  buildDashboardTrendSeriesKey,
  deriveDashboardRecordSummary,
  findDashboardTrendSeries,
  formatDashboardTrendSeriesLabel,
  formatTrendDate,
  formatTrendValue,
  getRecentRecordPresentation,
  selectRecentRecords,
  type DashboardRecordSummary,
} from "../../features/dashboard";
import {
  buildRecordViewerPath,
  formatRecordDate,
  formatRecordDuration,
} from "../../features/records/recordDisplay";
import { useGetDashboardSummaryQuery } from "../../services/dashboardApi";
import { useGetRecordsQuery } from "../../services/recordsApi";
import type { DashboardMetricTrend, RecordListItem } from "../../types";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const { data, isError, isLoading, refetch } = useGetRecordsQuery();
  const {
    data: dashboardSummary,
    isError: isTrendError,
    isLoading: isTrendLoading,
    refetch: refetchTrend,
  } = useGetDashboardSummaryQuery();
  const recentRecords = selectRecentRecords(data?.items ?? []);
  const summary = data
    ? deriveDashboardRecordSummary(data.items, Date.now())
    : null;

  return (
    <DashboardContent
      isError={isError}
      isLoading={isLoading}
      onRetry={() => void refetch()}
      records={recentRecords}
      summary={summary}
      trends={dashboardSummary?.metricTrends ?? []}
      isTrendError={isTrendError}
      isTrendLoading={isTrendLoading}
      onTrendRetry={() => void refetchTrend()}
    />
  );
}

export type DashboardContentProps = {
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  records: RecordListItem[];
  summary: DashboardRecordSummary | null;
  trends: DashboardMetricTrend[];
  isTrendError: boolean;
  isTrendLoading: boolean;
  onTrendRetry: () => void;
};

export function DashboardContent({
  isError,
  isLoading,
  onRetry,
  records,
  summary,
  trends,
  isTrendError,
  isTrendLoading,
  onTrendRetry,
}: DashboardContentProps) {
  return (
    <main className={styles.dashboardPage}>
      <div className={styles.content}>
        <header className={styles.pageHeader}>
          <p className={styles.kicker}>Dashboard</p>
          <h1>Your motion workspace</h1>
          <p>Continue training or return to your latest motion records.</p>
        </header>

        <QuickActions />
        <SummaryCards isError={isError} isLoading={isLoading} summary={summary} />
        <MetricSummaryTrendSection
          isError={isTrendError}
          isLoading={isTrendLoading}
          onRetry={onTrendRetry}
          trends={trends}
        />
        <RecentRecordsSection
          isError={isError}
          isLoading={isLoading}
          onRetry={onRetry}
          records={records}
        />
      </div>
    </main>
  );
}

export type MetricSummaryTrendSectionProps = {
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  trends: DashboardMetricTrend[];
};

export function MetricSummaryTrendSection({
  isError,
  isLoading,
  onRetry,
  trends,
}: MetricSummaryTrendSectionProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedTrend = findDashboardTrendSeries(trends, selectedKey);

  return (
    <section className={styles.section} aria-labelledby="metric-trend-title">
      <div className={styles.trendHeader}>
        <div>
          <p className={styles.sectionLabel}>Metric Summary Trend</p>
          <h2 id="metric-trend-title">Compatible history</h2>
          <p>Average values from Ready Records with matching metric definitions.</p>
        </div>
        {!isLoading && !isError && trends.length > 1 && selectedTrend && (
          <label className={styles.trendSelector}>
            <span>Metric series</span>
            <select
              value={buildDashboardTrendSeriesKey(selectedTrend)}
              onChange={(event) => setSelectedKey(event.target.value)}
            >
              {trends.map((trend) => {
                const key = buildDashboardTrendSeriesKey(trend);
                return (
                  <option key={key} value={key}>
                    {formatDashboardTrendSeriesLabel(trend)}
                  </option>
                );
              })}
            </select>
          </label>
        )}
      </div>

      {isLoading && <MetricTrendLoading />}
      {!isLoading && isError && <MetricTrendError onRetry={onRetry} />}
      {!isLoading && !isError && !selectedTrend && <MetricTrendEmpty />}
      {!isLoading && !isError && selectedTrend && (
        <MetricTrendContent trend={selectedTrend} />
      )}
    </section>
  );
}

export function MetricTrendLoading() {
  return (
    <div className={styles.trendLoading} aria-busy="true" aria-live="polite">
      <span className={styles.trendLoadingLabel} />
      <span className={styles.trendLoadingChart} />
      <span className={styles.srOnly}>Loading Metric Summary trend</span>
    </div>
  );
}

export function MetricTrendError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.statePanel} role="alert">
      <h3>Metric trend cannot load</h3>
      <p>Your other Dashboard sections are still available.</p>
      <button className={styles.retryButton} type="button" onClick={onRetry}>
        Retry trend
      </button>
    </div>
  );
}

export function MetricTrendEmpty() {
  return (
    <div className={styles.statePanel}>
      <h3>No compatible metric history</h3>
      <p>Compatible Ready Records are needed before a Metric Summary trend can be shown.</p>
    </div>
  );
}

export function MetricTrendContent({ trend }: { trend: DashboardMetricTrend }) {
  if (trend.points.length === 0) {
    return <MetricTrendEmpty />;
  }

  if (trend.points.length === 1) {
    return <SingleMetricTrendPoint trend={trend} />;
  }

  return <MetricTrendChart trend={trend} />;
}

export function SingleMetricTrendPoint({ trend }: { trend: DashboardMetricTrend }) {
  const point = trend.points[0];
  const path = buildRecordViewerPath(point.recordId);

  return (
    <div className={styles.singleTrendPoint}>
      <div>
        <p className={styles.singleTrendValue}>
          {formatTrendValue(point.value)} <span>{trend.unit}</span>
        </p>
        <p>
          {point.recordTitle} · {formatRecordDate(point.createdAt)} · {point.status}
        </p>
      </div>
      <p>One compatible Record is available. Add another to establish a trend.</p>
      {path && <Link to={path}>Open Viewer</Link>}
    </div>
  );
}

export function MetricTrendChart({ trend }: { trend: DashboardMetricTrend }) {
  const model = buildDashboardTrendChartModel(trend.points);

  if (!model) {
    return <SingleMetricTrendPoint trend={{ ...trend, points: trend.points.slice(0, 1) }} />;
  }

  return (
    <div className={styles.trendPanel}>
      <div className={styles.trendMeta}>
        <span>{trend.metricId}</span>
        <span>{trend.activityType}</span>
        <span>{trend.side}</span>
        <span>{trend.metricDefinitionVersion}</span>
        <span>Average · {trend.unit}</span>
      </div>
      <svg
        className={styles.trendChart}
        viewBox={`0 0 ${model.width} ${model.height}`}
        role="img"
        aria-labelledby="trend-chart-title trend-chart-description"
      >
        <title id="trend-chart-title">{`${trend.metricId} average history in ${trend.unit}`}</title>
        <desc id="trend-chart-description">
          {model.points.length} compatible Ready Records from {formatTrendDate(model.points[0].createdAt)} to {formatTrendDate(model.points[model.points.length - 1].createdAt)}.
        </desc>
        {model.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              className={styles.trendGridLine}
              x1={model.plotLeft}
              x2={model.plotRight}
              y1={tick.y}
              y2={tick.y}
            />
            <text className={styles.trendAxisLabel} x={model.plotLeft - 10} y={tick.y + 4} textAnchor="end">
              {tick.label}
            </text>
          </g>
        ))}
        <path className={styles.trendLine} d={model.linePath} />
        {model.points.map((point, index) => {
          const path = buildRecordViewerPath(point.recordId);
          const tooltip = `${point.recordTitle} · ${formatRecordDate(point.createdAt)} · ${trend.metricId} average: ${formatTrendValue(point.value)} ${trend.unit} · ${trend.activityType} · ${trend.side} · ${point.status}`;

          return path ? (
            <a href={path} key={`${point.recordId}-${index}`} aria-label={`${tooltip}. Open Viewer.`}>
              <circle className={styles.trendPoint} cx={point.x} cy={point.y} r="7">
                <title>{tooltip}</title>
              </circle>
            </a>
          ) : null;
        })}
        {model.xLabels.map((label) => (
          <text
            className={styles.trendAxisLabel}
            key={`${label.x}-${label.label}`}
            x={label.x}
            y={model.plotBottom + 30}
            textAnchor={label.x === model.plotLeft ? "start" : "end"}
          >
            {label.label}
          </text>
        ))}
      </svg>
      <p className={styles.trendHint}>Select a point to open its Ready Record in Viewer.</p>
    </div>
  );
}

export type SummaryCardsProps = {
  isError: boolean;
  isLoading: boolean;
  summary: DashboardRecordSummary | null;
};

export function SummaryCards({ isError, isLoading, summary }: SummaryCardsProps) {
  return (
    <section className={styles.section} aria-labelledby="summary-cards-title">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionLabel}>Summary</p>
          <h2 id="summary-cards-title">Record overview</h2>
        </div>
      </div>

      {isLoading && <SummaryCardsLoading />}
      {!isLoading && isError && (
        <div className={styles.summaryError} role="status">
          <p>Record summary is unavailable while records cannot load.</p>
        </div>
      )}
      {!isLoading && !isError && summary && (
        <div className={styles.summaryGrid}>
          <SummaryCard label="Total Records" value={summary.totalRecords} />
          <SummaryCard
            context="Status: Ready"
            label="Ready Records"
            value={summary.readyRecords}
          />
          <SummaryCard
            context="Status: Failed"
            label="Failed Records"
            value={summary.failedRecords}
          />
          <SummaryCard
            context={`Last ${summary.recentActivityWindowDays} days`}
            label="Recent Activity"
            value={summary.recentActivityCount}
          />
        </div>
      )}
    </section>
  );
}

export function SummaryCard({
  context,
  label,
  value,
}: {
  context?: string;
  label: string;
  value: number;
}) {
  return (
    <article className={styles.summaryCard}>
      <h3>{label}</h3>
      <p className={styles.summaryValue}>{value}</p>
      {context && <p className={styles.summaryContext}>{context}</p>}
    </article>
  );
}

export function SummaryCardsLoading() {
  return (
    <div className={styles.summaryGrid} aria-busy="true" aria-live="polite">
      {Array.from({ length: 4 }, (_, index) => (
        <div className={styles.summaryCardSkeleton} key={index} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
      <span className={styles.srOnly}>Loading record summary</span>
    </div>
  );
}

export function QuickActions() {
  return (
    <section className={styles.section} aria-labelledby="quick-actions-title">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionLabel}>Quick Actions</p>
          <h2 id="quick-actions-title">Where would you like to go?</h2>
        </div>
      </div>
      <nav className={styles.quickActions} aria-label="Dashboard quick actions">
        {DASHBOARD_QUICK_ACTIONS.map((action, index) => (
          <Link
            className={index === 0 ? styles.primaryQuickAction : styles.quickAction}
            key={action.to}
            to={action.to}
          >
            {action.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}

export function RecentRecordsSection({
  isError,
  isLoading,
  onRetry,
  records,
}: Pick<DashboardContentProps, "isError" | "isLoading" | "onRetry" | "records">) {
  return (
    <section className={styles.section} aria-labelledby="recent-records-title">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionLabel}>Recent Records</p>
          <h2 id="recent-records-title">Your latest sessions</h2>
        </div>
        <Link className={styles.viewAllLink} to="/records">
          View All Records
        </Link>
      </div>

      {isLoading && <RecentRecordsLoading />}
      {!isLoading && isError && <RecentRecordsError onRetry={onRetry} />}
      {!isLoading && !isError && records.length === 0 && <RecentRecordsEmpty />}
      {!isLoading && !isError && records.length > 0 && (
        <ul className={styles.recordList} aria-label="Recent record list">
          {records.map((record) => (
            <RecentRecordItem key={record.recordId} record={record} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function RecentRecordsLoading() {
  return (
    <div className={styles.loadingPanel} aria-busy="true" aria-live="polite">
      <span className={styles.loadingBar} />
      <span className={styles.loadingBar} />
      <span className={styles.loadingBar} />
      <span className={styles.srOnly}>Loading recent records</span>
    </div>
  );
}

export function RecentRecordsEmpty() {
  return (
    <div className={styles.statePanel}>
      <h3>No records yet</h3>
      <p>Start a capture to create your first motion record.</p>
      <Link className={styles.primaryStateAction} to="/capture">
        Start Capture
      </Link>
    </div>
  );
}

export function RecentRecordsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.statePanel} role="alert">
      <h3>Recent records cannot load</h3>
      <p>We could not retrieve your records. Try the request again.</p>
      <RetryButton onRetry={onRetry} />
    </div>
  );
}

export function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <button className={styles.retryButton} type="button" onClick={onRetry}>
      Retry
    </button>
  );
}

export function RecentRecordItem({ record }: { record: RecordListItem }) {
  const presentation = getRecentRecordPresentation(record);

  return (
    <li className={styles.recordItem}>
      <div className={styles.recordMain}>
        <div className={styles.recordTitleRow}>
          <h3>{record.title}</h3>
          <span className={styles.statusBadge} data-tone={presentation.statusTone}>
            {presentation.statusLabel}
          </span>
        </div>
        {record.description && <p className={styles.recordDescription}>{record.description}</p>}
        {record.tags.length > 0 && (
          <div className={styles.tagList} aria-label="Record tags">
            {record.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      <dl className={styles.recordMeta}>
        <div>
          <dt>Created</dt>
          <dd>{formatRecordDate(record.createdAt)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatRecordDuration(record.duration)}</dd>
        </div>
      </dl>

      <div className={styles.recordAction}>
        {presentation.path ? (
          <Link to={presentation.path}>{presentation.actionLabel}</Link>
        ) : (
          <span>Unavailable</span>
        )}
      </div>
    </li>
  );
}
