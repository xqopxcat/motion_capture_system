import { Link } from "react-router-dom";
import {
  DASHBOARD_QUICK_ACTIONS,
  getRecentRecordPresentation,
  selectRecentRecords,
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

  return (
    <DashboardContent
      isError={isError}
      isLoading={isLoading}
      onRetry={() => void refetch()}
      records={recentRecords}
    />
  );
}

export type DashboardContentProps = {
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  records: RecordListItem[];
};

export function DashboardContent({
  isError,
  isLoading,
  onRetry,
  records,
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
}: DashboardContentProps) {
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
