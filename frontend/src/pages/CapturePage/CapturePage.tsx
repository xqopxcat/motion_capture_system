import { useNavigate } from "react-router-dom";
import { CaptureDiagnosticsPanel, UnifiedCaptureStage } from "../../features/capture";
import { captureRuntimeInstrumentation } from "../../features/capture/instrumentation/captureRuntimeInstrumentation";
import { useCapturePipeline } from "../../hooks";
import { CaptureNavigationGuard } from "./CaptureNavigationGuard";
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
    <main
      className={styles.capturePage}
      data-live-capture={
        productStateUsesLiveCamera(
          controller.productState.type,
          controller.cameraPreview.stream !== null,
        ) ? "true" : undefined
      }
    >
      <CaptureNavigationGuard
        routeLeaveRequiresConfirmation={controller.routeLeaveRequiresConfirmation}
        protection={controller.presentation.routeLeaveProtection}
      />
      <section className={styles.content} data-testid="responsive-capture-page">
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
          currentFilteredPose={controller.currentFilteredPose}
          currentDisplayFrame={controller.currentDisplayFrame}
          liveVideoElement={controller.previewVideoElement}
          onLiveVideoElementChange={controller.cameraPreview.onVideoElementChange}
          onPrimaryAction={runPrimaryAction}
          onRetake={controller.retake}
          recordTitle={controller.recordTitle}
          onRecordTitleChange={controller.setRecordTitle}
          cameraFacingMode={controller.cameraFacingMode}
          onFlipCamera={controller.flipCamera}
          skeletonVisible={controller.skeletonVisible}
          onSkeletonVisibilityChange={controller.setSkeletonVisible}
        />

        <CaptureDiagnosticsPanel />
      </section>
    </main>
  );
}

export function productStateUsesLiveCamera(state: string, hasCameraStream: boolean) {
  return state === "Ready" || state === "Countdown" || state === "Recording" ||
    (state === "Preparing" && hasCameraStream);
}
