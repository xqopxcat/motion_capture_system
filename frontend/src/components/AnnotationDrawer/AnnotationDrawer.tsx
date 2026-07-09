import type { AnnotationMarker } from "../../types";
import styles from "./AnnotationDrawer.module.css";

export type AnnotationDrawerProps = {
  annotations: AnnotationMarker[];
  currentFrame?: number;
  createErrorMessage?: string | null;
  isCreating?: boolean;
  isOpen: boolean;
  selectedAnnotationId?: string | null;
  onCreateAnnotation?: (draft: { note: string; title: string }) => void;
  onClose?: () => void;
  onSelectAnnotation?: (annotation: AnnotationMarker) => void;
};

export function AnnotationDrawer({
  annotations,
  currentFrame,
  createErrorMessage,
  isCreating = false,
  isOpen,
  selectedAnnotationId,
  onCreateAnnotation,
  onClose,
  onSelectAnnotation,
}: AnnotationDrawerProps) {
  if (!isOpen) {
    return null;
  }

  const selectedAnnotation =
    annotations.find((annotation) => annotation.annotationId === selectedAnnotationId) ??
    annotations[0] ??
    null;

  return (
    <aside className={styles.drawer} aria-label="Annotation drawer">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Annotations</p>
          <h2 className={styles.title}>Annotation Drawer</h2>
        </div>
        <button className={styles.closeButton} type="button" onClick={onClose}>
          Close
        </button>
      </header>

      {typeof currentFrame === "number" && (
        <p className={styles.currentFrame}>Current frame: {currentFrame}</p>
      )}

      <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const title = readFormValue(form, "title").trim();
          const note = readFormValue(form, "note");

          if (!title) {
            return;
          }

          onCreateAnnotation?.({
            note,
            title,
          });
          form.reset();
        }}
      >
        <label className={styles.field}>
          <span>Title</span>
          <input
            maxLength={80}
            name="title"
            type="text"
          />
        </label>
        <label className={styles.field}>
          <span>Note</span>
          <textarea
            name="note"
            rows={3}
          />
        </label>
        {createErrorMessage && <p className={styles.errorMessage}>{createErrorMessage}</p>}
        <button
          className={styles.createButton}
          disabled={isCreating}
          type="submit"
        >
          {isCreating ? "Creating..." : "Create annotation"}
        </button>
      </form>

      <ul className={styles.list}>
        {annotations.length === 0 && (
          <li className={styles.emptyState}>No annotations for this record yet.</li>
        )}
        {annotations.map((annotation) => {
          const isSelected = annotation.annotationId === selectedAnnotation?.annotationId;

          return (
            <li className={styles.item} key={annotation.annotationId}>
              <button
                aria-pressed={isSelected}
                className={styles.annotationButton}
                type="button"
                onClick={() => onSelectAnnotation?.(annotation)}
              >
                <span>{annotation.title}</span>
                <span className={styles.frameLabel}>Frame {annotation.frameIndex}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <section className={styles.details} aria-label="Selected annotation details">
        {selectedAnnotation ? (
          <>
            <p className={styles.kicker}>Selected</p>
            <h3>{selectedAnnotation.title}</h3>
            <dl className={styles.detailList}>
              <div>
                <dt>Frame</dt>
                <dd>{selectedAnnotation.frameIndex}</dd>
              </div>
              {typeof selectedAnnotation.timestamp === "number" && (
                <div>
                  <dt>Timestamp</dt>
                  <dd>{selectedAnnotation.timestamp.toFixed(2)}s</dd>
                </div>
              )}
            </dl>
            {selectedAnnotation.note && (
              <p className={styles.note}>{selectedAnnotation.note}</p>
            )}
          </>
        ) : (
          <p className={styles.emptyState}>Select an annotation marker to view details.</p>
        )}
      </section>
    </aside>
  );
}

function readFormValue(form: HTMLFormElement, fieldName: string): string {
  const field = form.elements.namedItem(fieldName);

  if (!field || !("value" in field)) {
    return "";
  }

  return String(field.value);
}
