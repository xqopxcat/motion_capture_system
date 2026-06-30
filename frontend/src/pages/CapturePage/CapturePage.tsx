import { CameraPreview } from "../../components";
import { useCapturePipeline } from "../../hooks";
import styles from "./CapturePage.module.css";

export function CapturePage() {
  const { cameraPreview } = useCapturePipeline();

  return (
    <main className={styles.capturePage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Sprint 1 Capture Foundation</p>
          <h1 className={styles.title}>Capture</h1>
          <p className={styles.description}>
            Start camera preview to prepare a capture session. Recording, pose detection, overlays,
            and upload remain out of scope for this step.
          </p>
        </header>

        <CameraPreview
          stream={cameraPreview.stream}
          status={cameraPreview.status}
          errorMessage={cameraPreview.errorMessage}
          onStart={cameraPreview.startCamera}
          onStop={cameraPreview.stopCamera}
        />
      </section>
    </main>
  );
}
