import { useGetRecordsQuery } from "../../services/recordsApi";
import type { RecordListItem } from "../../types";
import {
  formatRecordDate,
  formatRecordDuration,
  getRecordStatusMeta,
} from "../../features/records/recordDisplay";
import styles from "./RecordsPage.module.css";

export function RecordsPage() {
  const { data, isError, isLoading } = useGetRecordsQuery();

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
                <RecordCard key={record.recordId} record={record} />
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}

function RecordCard({ record }: { record: RecordListItem }) {
  const status = getRecordStatusMeta(record.status);

  return (
    <li className={styles.recordCard}>
      <div className={styles.thumbnailFrame} aria-label="Record thumbnail">
        {record.thumbnailUrl && shouldRenderThumbnailImage(record.thumbnailUrl) ? (
          <img src={record.thumbnailUrl} alt="" loading="lazy" />
        ) : record.thumbnailUrl ? (
          <span>Thumbnail ready</span>
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
    </li>
  );
}

function shouldRenderThumbnailImage(url: string) {
  return !url.includes("mock-storage.local/");
}
