import type { AnnotationDisplayItem } from "../../types";
import styles from "./AnnotationDrawer.module.css";

export type AnnotationDrawerProps = {
  annotations: AnnotationDisplayItem[];
  onCreateIntent?: () => void;
  onDeleteIntent?: (annotationId: string) => void;
  onEditIntent?: (annotationId: string) => void;
  onJumpFrameIntent?: (frameIndex: number) => void;
};

export function AnnotationDrawer({
  annotations,
  onCreateIntent,
  onDeleteIntent,
  onEditIntent,
  onJumpFrameIntent,
}: AnnotationDrawerProps) {
  return (
    <aside className={styles.drawer} aria-label="Annotation drawer">
      <button type="button" onClick={onCreateIntent}>
        Create Annotation
      </button>
      <ul className={styles.list}>
        {annotations.map((annotation) => (
          <li className={styles.item} key={annotation.id}>
            <span>{annotation.title}</span>
            <div className={styles.actions}>
              <button type="button" onClick={() => onJumpFrameIntent?.(annotation.frameIndex)}>
                Jump
              </button>
              <button type="button" onClick={() => onEditIntent?.(annotation.id)}>
                Edit
              </button>
              <button type="button" onClick={() => onDeleteIntent?.(annotation.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
