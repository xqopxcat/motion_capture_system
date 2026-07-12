import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  mapCompareSelectionToApiParams,
  parseCompareRouteSelection,
} from "../../features/compare";
import styles from "./ComparePage.module.css";

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const routeSelection = useMemo(
    () => parseCompareRouteSelection(searchParams),
    [searchParams],
  );
  const apiParams = mapCompareSelectionToApiParams(routeSelection);
  const hasAnyRecord = Boolean(
    routeSelection.leftRecordId || routeSelection.rightRecordId,
  );

  return (
    <main className={styles.comparePage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Compare Foundation</p>
          <h1 className={styles.title}>Compare</h1>
          <p className={styles.description}>
            Standalone Compare route shell for initializing left and right Record context.
          </p>
        </header>

        {!hasAnyRecord && (
          <section className={styles.statePanel}>
            <h2>No records selected</h2>
            <p>Record selection will be added in Task 48.</p>
          </section>
        )}

        {hasAnyRecord && (
          <section className={styles.selectionPanel} aria-label="Compare route selection">
            <h2>Route selection</h2>
            <p>
              Query parameters are parsed from the Compare route. Loading and validating
              selected Records starts in Task 48.
            </p>
            <dl className={styles.selectionGrid}>
              <div className={styles.selectionSlot}>
                <dt>Left record</dt>
                <dd>{routeSelection.leftRecordId ?? "Not selected"}</dd>
              </div>
              <div className={styles.selectionSlot}>
                <dt>Right record</dt>
                <dd>{routeSelection.rightRecordId ?? "Not selected"}</dd>
              </div>
            </dl>
            <p className={styles.taskNote}>
              {apiParams
                ? `Prepared API mapping: recordA=${apiParams.recordA}, recordB=${apiParams.recordB}.`
                : "Both left and right records are required before Compare API data can be requested."}
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
