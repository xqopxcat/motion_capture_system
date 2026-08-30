import type { CompareRouteSelection, CompareSelectionSide, RecordListItem } from "../../types";
import styles from "./CompareRecordSelector.module.css";

export type CompareRecordSelectorProps = {
  analysisReady: boolean;
  records: RecordListItem[];
  selection: CompareRouteSelection;
  showRecordList: boolean;
  onClearSelection: (side: CompareSelectionSide) => void;
  onSelectRecord: (side: CompareSelectionSide, recordId: string) => void;
  onToggleRecordList: () => void;
};

export function CompareRecordSelector({
  analysisReady,
  records,
  selection,
  showRecordList,
  onClearSelection,
  onSelectRecord,
  onToggleRecordList,
}: CompareRecordSelectorProps) {
  return (
    <section className={styles.selector} data-analysis-ready={analysisReady} aria-label="Compare record selection">
      {analysisReady && (
        <header className={styles.selectionHeader}>
          <div>
            <p>Comparing</p>
            <h2>Selected records</h2>
          </div>
          <button className={styles.changeRecordsButton} type="button" onClick={onToggleRecordList} aria-expanded={showRecordList}>
            {showRecordList ? "Hide records" : "Change records"}
          </button>
        </header>
      )}
      <div className={styles.slots}>
        <SelectionSlot
          label="Left record"
          record={findRecord(records, selection.leftRecordId)}
          recordId={selection.leftRecordId}
          onClear={() => onClearSelection("left")}
        />
        <SelectionSlot
          label="Right record"
          record={findRecord(records, selection.rightRecordId)}
          recordId={selection.rightRecordId}
          onClear={() => onClearSelection("right")}
        />
      </div>

      {showRecordList && <section className={styles.recordListPanel} aria-label="Available records">
        <header className={styles.listHeader}>
          <h2>Available records</h2>
          <p>Only Ready records can be selected for Compare.</p>
        </header>
        <ul className={styles.recordList}>
          {records.map((record) => (
            <RecordSelectionItem
              key={record.recordId}
              record={record}
              selection={selection}
              onSelectRecord={onSelectRecord}
            />
          ))}
        </ul>
      </section>}
    </section>
  );
}

function SelectionSlot({
  label,
  record,
  recordId,
  onClear,
}: {
  label: string;
  record?: RecordListItem;
  recordId: string | null;
  onClear: () => void;
}) {
  return (
    <section className={styles.slot}>
      <div>
        <p className={styles.slotLabel}>{label}</p>
        <h2>{record?.title ?? recordId ?? "Not selected"}</h2>
        <p>{record?.description || record?.recordId || "Choose a Ready record below."}</p>
      </div>
      <button disabled={!recordId} type="button" onClick={onClear}>
        Clear
      </button>
    </section>
  );
}

function RecordSelectionItem({
  record,
  selection,
  onSelectRecord,
}: {
  record: RecordListItem;
  selection: CompareRouteSelection;
  onSelectRecord: (side: CompareSelectionSide, recordId: string) => void;
}) {
  const isReady = record.status === "Ready";
  const isLeftSelected = selection.leftRecordId === record.recordId;
  const isRightSelected = selection.rightRecordId === record.recordId;
  const disableLeft = !isReady || isRightSelected;
  const disableRight = !isReady || isLeftSelected;

  return (
    <li className={styles.recordItem}>
      <div className={styles.recordSummary}>
        <div className={styles.titleRow}>
          <h3>{record.title}</h3>
          <span className={styles.statusBadge} data-status={record.status}>
            {record.status}
          </span>
        </div>
        <p>{record.description || record.recordId}</p>
      </div>
      <div className={styles.recordActions}>
        <button
          disabled={disableLeft}
          type="button"
          onClick={() => onSelectRecord("left", record.recordId)}
        >
          Set left
        </button>
        <button
          disabled={disableRight}
          type="button"
          onClick={() => onSelectRecord("right", record.recordId)}
        >
          Set right
        </button>
      </div>
    </li>
  );
}

function findRecord(records: RecordListItem[], recordId: string | null) {
  if (!recordId) {
    return undefined;
  }

  return records.find((record) => record.recordId === recordId);
}
