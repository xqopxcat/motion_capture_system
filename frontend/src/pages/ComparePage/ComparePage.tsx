import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CompareRecordSelector,
  mapCompareSelectionToApiParams,
  parseCompareRouteSelection,
  updateCompareRouteSelectionParam,
} from "../../features/compare";
import { useGetRecordsQuery } from "../../services/recordsApi";
import type { CompareSelectionSide, RecordListItem } from "../../types";
import styles from "./ComparePage.module.css";

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isError, isLoading } = useGetRecordsQuery();
  const records = data?.items ?? [];
  const routeSelection = useMemo(
    () => parseCompareRouteSelection(searchParams),
    [searchParams],
  );
  const apiParams = mapCompareSelectionToApiParams(routeSelection);
  const validationMessages = isLoading || isError
    ? []
    : getSelectionValidationMessages(routeSelection, records);
  const selectionStateMessage = getSelectionStateMessage(
    routeSelection.leftRecordId,
    routeSelection.rightRecordId,
  );
  const handleSelectRecord = (side: CompareSelectionSide, recordId: string) => {
    const record = records.find((item) => item.recordId === recordId);

    if (!record || record.status !== "Ready") {
      return;
    }

    if (
      (side === "left" && routeSelection.rightRecordId === recordId) ||
      (side === "right" && routeSelection.leftRecordId === recordId)
    ) {
      return;
    }

    setSearchParams(updateCompareRouteSelectionParam(searchParams, side, recordId));
  };
  const handleClearSelection = (side: CompareSelectionSide) => {
    setSearchParams(updateCompareRouteSelectionParam(searchParams, side, null));
  };

  return (
    <main className={styles.comparePage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Compare Foundation</p>
          <h1 className={styles.title}>Compare</h1>
          <p className={styles.description}>
            Select two Ready Records for Compare. Side-by-side rendering starts in Task 49.
          </p>
        </header>

        <section className={styles.selectionPanel} aria-label="Compare selection status">
          <h2>Selection status</h2>
          <p>{selectionStateMessage}</p>
          {apiParams && validationMessages.length === 0 && (
            <p className={styles.taskNote}>
              Prepared API mapping: recordA={apiParams.recordA}, recordB={apiParams.recordB}.
            </p>
          )}
          {validationMessages.length > 0 && (
            <ul className={styles.validationList} role="alert">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </section>

        {isLoading && (
          <section className={styles.statePanel} aria-live="polite">
            <h2>Loading records</h2>
            <p>Fetching Ready Records for Compare selection.</p>
          </section>
        )}

        {isError && (
          <section className={styles.statePanel} role="alert">
            <h2>Records cannot load</h2>
            <p>Compare selection uses the Records API, and the request failed.</p>
          </section>
        )}

        {!isLoading && !isError && records.length === 0 && (
          <section className={styles.statePanel}>
            <h2>No records available</h2>
            <p>Create and finalize Ready Records before starting Compare.</p>
          </section>
        )}

        {!isLoading && !isError && records.length > 0 && (
          <CompareRecordSelector
            records={records}
            selection={routeSelection}
            onClearSelection={handleClearSelection}
            onSelectRecord={handleSelectRecord}
          />
        )}
      </section>
    </main>
  );
}

function getSelectionStateMessage(leftRecordId: string | null, rightRecordId: string | null) {
  if (leftRecordId && rightRecordId) {
    return "Left and right Records are selected. Task 49 will render the side-by-side workspace.";
  }

  if (leftRecordId) {
    return "Left Record is selected. Choose a different Ready Record for the right side.";
  }

  if (rightRecordId) {
    return "Right Record is selected. Choose a different Ready Record for the left side.";
  }

  return "No Records selected. Choose one Ready Record for each side.";
}

function getSelectionValidationMessages(
  selection: {
    leftRecordId: string | null;
    rightRecordId: string | null;
  },
  records: RecordListItem[],
) {
  const messages: string[] = [];
  const leftRecord = findRecord(records, selection.leftRecordId);
  const rightRecord = findRecord(records, selection.rightRecordId);

  if (
    selection.leftRecordId &&
    selection.rightRecordId &&
    selection.leftRecordId === selection.rightRecordId
  ) {
    messages.push("Left and right cannot use the same Record.");
  }

  if (selection.leftRecordId && !leftRecord) {
    messages.push(`Left Record "${selection.leftRecordId}" was not found.`);
  }

  if (selection.rightRecordId && !rightRecord) {
    messages.push(`Right Record "${selection.rightRecordId}" was not found.`);
  }

  if (leftRecord && leftRecord.status !== "Ready") {
    messages.push(`Left Record "${leftRecord.title}" is ${leftRecord.status}, not Ready.`);
  }

  if (rightRecord && rightRecord.status !== "Ready") {
    messages.push(`Right Record "${rightRecord.title}" is ${rightRecord.status}, not Ready.`);
  }

  return messages;
}

function findRecord(records: RecordListItem[], recordId: string | null) {
  if (!recordId) {
    return undefined;
  }

  return records.find((record) => record.recordId === recordId);
}
