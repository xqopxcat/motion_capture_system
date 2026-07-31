import { useNavigate } from "react-router-dom";
import { CaptureDiagnosticsPanel, UnifiedCaptureStage } from "../../features/capture";
import { captureRuntimeInstrumentation } from "../../features/capture/instrumentation/captureRuntimeInstrumentation";
import { useCapturePipeline } from "../../hooks";
import styles from "./CapturePage.module.css";

export function CapturePage() {
  captureRuntimeInstrumentation.recordReactRender("CapturePage");
  const navigate = useNavigate();
  const controller = useCapturePipeline();

  const runPrimaryAction = () => {
    if (controller.productState.type === "Completed") {
      navigate(`/records/${encodeURIComponent(controller.productState.recordId)}`);
      return;
    }
    controller.primaryAction();
  };

  return (
    <main className={styles.capturePage}>
      <section className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>Motion Capture</p>
          <h1 className={styles.title}>Capture</h1>
          <p className={styles.description}>
            Record, review, and save a motion sample from one capture stage.
          </p>
        </header>

        <UnifiedCaptureStage
          productState={controller.productState}
          presentation={controller.presentation}
          cameraStream={controller.cameraPreview.stream}
          cameraStatus={controller.cameraPreview.status}
          cameraErrorMessage={controller.cameraPreview.errorMessage}
          currentPoseResult={controller.currentPoseResult}
          liveVideoElement={controller.previewVideoElement}
          onLiveVideoElementChange={controller.cameraPreview.onVideoElementChange}
          onPrimaryAction={runPrimaryAction}
          onRetake={controller.retake}
          recordTitle={controller.recordTitle}
          onRecordTitleChange={controller.setRecordTitle}
        />

        <CaptureDiagnosticsPanel />
      </section>
    </main>
  );
}
