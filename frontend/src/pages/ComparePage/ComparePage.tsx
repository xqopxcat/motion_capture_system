import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CompareAnalysisLayout,
  CompareRecordSelector,
  canSelectCompareRecord,
  findCompareRecord,
  getCompareSelectionValidationMessages,
  mapCompareSelectionToApiParams,
  parseCompareRouteSelection,
  updateCompareRouteSelectionParam,
  useCompareRecordRuntime,
} from "../../features/compare";
import { useGetRecordsQuery } from "../../services/recordsApi";
import type { CompareSelectionSide } from "../../types";
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
    : getCompareSelectionValidationMessages(routeSelection, records);
  const selectedLeftRecord = findCompareRecord(records, routeSelection.leftRecordId);
  const selectedRightRecord = findCompareRecord(records, routeSelection.rightRecordId);
  const canShowAnalysisLayout = Boolean(
    selectedLeftRecord &&
      selectedRightRecord &&
      selectedLeftRecord.status === "Ready" &&
      selectedRightRecord.status === "Ready" &&
      validationMessages.length === 0 &&
      !isLoading &&
      !isError,
  );
  const leftRuntime = useCompareRecordRuntime(
    canShowAnalysisLayout ? routeSelection.leftRecordId : null,
    "compare-left-skeleton-canvas",
  );
  const rightRuntime = useCompareRecordRuntime(
    canShowAnalysisLayout ? routeSelection.rightRecordId : null,
    "compare-right-skeleton-canvas",
  );
  const selectionStateMessage = getSelectionStateMessage(
    routeSelection.leftRecordId,
    routeSelection.rightRecordId,
    canShowAnalysisLayout,
  );
  const handleSelectRecord = (side: CompareSelectionSide, recordId: string) => {
    if (!canSelectCompareRecord({ records, recordId, selection: routeSelection, side })) {
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
            Select two Ready Records for Compare. Shared playback starts in Task 50.
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

        {canShowAnalysisLayout && selectedLeftRecord && selectedRightRecord && (
          <CompareAnalysisLayout
            leftRecord={selectedLeftRecord}
            leftRuntime={leftRuntime}
            rightRecord={selectedRightRecord}
            rightRuntime={rightRuntime}
          />
        )}
      </section>
    </main>
  );
}

function getSelectionStateMessage(
  leftRecordId: string | null,
  rightRecordId: string | null,
  canShowAnalysisLayout: boolean,
) {
  if (canShowAnalysisLayout) {
    return "Two Ready Records are selected. The side-by-side Compare layout is available below.";
  }

  if (leftRecordId && rightRecordId) {
    return "Left and right Records are selected. Resolve any validation issues before analysis.";
  }

  if (leftRecordId) {
    return "Left Record is selected. Choose a different Ready Record for the right side.";
  }

  if (rightRecordId) {
    return "Right Record is selected. Choose a different Ready Record for the left side.";
  }

  return "No Records selected. Choose one Ready Record for each side.";
}
