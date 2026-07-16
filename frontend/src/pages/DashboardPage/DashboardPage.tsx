import { Link } from "react-router-dom";
import {
  DASHBOARD_QUICK_ACTIONS,
  deriveDashboardRecordSummary,
  getRecentRecordPresentation,
  selectRecentRecords,
  type DashboardRecordSummary,
} from "../../features/dashboard";
import {
  formatRecordDate,
  formatRecordDuration,
} from "../../features/records/recordDisplay";
import { useGetRecordsQuery } from "../../services/recordsApi";
import type { RecordListItem } from "../../types";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const { data, isError, isLoading, refetch } = useGetRecordsQuery();
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
    />
  );
}

export type DashboardContentProps = {
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  records: RecordListItem[];
  summary: DashboardRecordSummary | null;
};

export function DashboardContent({
  isError,
  isLoading,
  onRetry,
  records,
  summary,
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
}: Omit<DashboardContentProps, "summary">) {
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
