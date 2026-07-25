import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useDeleteRecordMutation,
  useFinalizeRecordMutation,
  useGetRecordsQuery,
  useRetryRecordMutation,
} from "../../services/recordsApi";
import type { RecordListItem } from "../../types";
import {
  buildRecordViewerPath,
  formatRecordDate,
  formatRecordDuration,
  getRecordStatusMeta,
} from "../../features/records/recordDisplay";
import styles from "./RecordsPage.module.css";

export function RecordsPage() {
  const { data, isError, isLoading, refetch } = useGetRecordsQuery();
  const [deleteRecord, deleteState] = useDeleteRecordMutation();
  const [retryRecord, retryState] = useRetryRecordMutation();
  const [finalizeRecord, finalizeState] = useFinalizeRecordMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const actionBusy = deleteState.isLoading || retryState.isLoading || finalizeState.isLoading;

  async function handleDelete(record: RecordListItem) {
    if (!window.confirm(`Delete “${record.title}” and all of its private artifacts?`)) return;
    setActionError(null);
    try {
      const result = await deleteRecord(record.recordId).unwrap();
      if (result.status === "CleanupFailed") {
        setActionError(result.failureMessage ?? "Storage cleanup failed. The Record was retained.");
      }
      await refetch();
    } catch {
      setActionError("Record deletion failed. The Record was retained; retry is safe.");
    }
  }

  async function handleRetry(record: RecordListItem) {
    setActionError(null);
    try {
      await retryRecord(record.recordId).unwrap();
      const result = await finalizeRecord({ recordId: record.recordId }).unwrap();
      if (result.status === "Failed") {
        setActionError(result.failureMessage ?? "Record finalization failed again.");
      }
      await refetch();
    } catch {
      setActionError("Record retry failed. Refresh and try again.");
    }
  }

  return (
    <main className={styles.recordsPage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Records</p>
          <h1>Motion Records</h1>
          <p>Saved motion sessions from the backend Record metadata boundary.</p>
        </header>

        {isLoading && (
          <section className={styles.statePanel} aria-live="polite">
            <h2>Loading records</h2>
            <p>Fetching Record metadata.</p>
          </section>
        )}

        {isError && (
          <section className={styles.statePanel} role="alert">
            <h2>Records cannot load</h2>
            <p>Record List data could not be loaded from the backend.</p>
          </section>
        )}
        {actionError && (
          <section className={styles.statePanel} role="alert">
            <h2>Record action needs attention</h2>
            <p>{actionError}</p>
          </section>
        )}

        {!isLoading && !isError && data?.total === 0 && (
          <section className={styles.statePanel}>
            <h2>No records yet</h2>
            <p>Create and finalize a Record before it appears in this list.</p>
          </section>
        )}

        {!isLoading && !isError && data && data.total > 0 && (
          <section className={styles.listPanel} aria-label="Record list">
            <div className={styles.listHeader}>
              <span>{data.total} records</span>
            </div>
            <ul className={styles.recordList}>
              {data.items.map((record) => (
                <RecordCard
                  key={record.recordId}
                  record={record}
                  disabled={actionBusy}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                />
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}

function RecordCard({
  record,
  disabled,
  onDelete,
  onRetry,
}: {
  record: RecordListItem;
  disabled: boolean;
  onDelete: (record: RecordListItem) => Promise<void>;
  onRetry: (record: RecordListItem) => Promise<void>;
}) {
  const status = getRecordStatusMeta(record.status);
  const viewerPath = buildRecordViewerPath(record.recordId);

  return (
    <li className={styles.recordCard}>
      <div className={styles.thumbnailFrame} aria-label="Record thumbnail">
        {record.thumbnailUrl ? (
          <img src={record.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <span>No thumbnail</span>
        )}
      </div>
      <div className={styles.primaryColumn}>
        <div className={styles.titleRow}>
          <h2>{record.title}</h2>
          <span className={styles.statusBadge} data-tone={status.tone}>
            {status.label}
          </span>
        </div>
        <p>{record.description || record.recordId}</p>
        {record.tags.length > 0 && (
          <div className={styles.tagList} aria-label="Record tags">
            {record.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <dl className={styles.metaList}>
        <div>
          <dt>Duration</dt>
          <dd>{formatRecordDuration(record.duration)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatRecordDate(record.createdAt)}</dd>
        </div>
      </dl>
      <div className={styles.actionColumn}>
        {viewerPath ? (
          <Link className={styles.openLink} to={viewerPath}>
            Open
          </Link>
        ) : (
          <span className={styles.disabledOpen}>Unavailable</span>
        )}
        {record.status === "Failed" && record.retryable && (
          <button type="button" disabled={disabled} onClick={() => void onRetry(record)}>
            Retry
          </button>
        )}
        <button type="button" disabled={disabled} onClick={() => void onDelete(record)}>
          Delete
        </button>
      </div>
    </li>
  );
}
