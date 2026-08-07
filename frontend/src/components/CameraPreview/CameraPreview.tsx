import { useEffect, useRef } from "react";
import type { CameraStreamStatus } from "../../hooks";
import styles from "./CameraPreview.module.css";

export type CameraPreviewProps = {
  stream: MediaStream | null;
  status: CameraStreamStatus;
  errorMessage?: string | null;
  onStart: () => void;
  onStop: () => void;
  showControls?: boolean;
  onVideoElementChange?: (videoElement: HTMLVideoElement | null) => void;
  onVideoDimensionsChange?: (width: number, height: number) => void;
  mirror?: boolean;
};

export function CameraPreview({
  stream,
  status,
  errorMessage,
  onStart,
  onStop,
  showControls = true,
  onVideoElementChange,
  onVideoDimensionsChange,
  mirror = false,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isReady = status === "ready";
  const isRequesting = status === "requesting";
  const hasError = status === "permission-denied" || status === "unsupported" || status === "error";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    onVideoElementChange?.(videoRef.current);

    return () => {
      onVideoElementChange?.(null);
    };
  }, [onVideoElementChange]);

  return (
    <section className={styles.cameraPreview} aria-label="Camera preview">
      <div className={styles.previewSurface}>
        <video
          ref={videoRef}
          className={styles.video}
          data-mirror={mirror ? "true" : "false"}
          autoPlay
          muted
          playsInline
          aria-label="Live camera preview"
          onLoadedMetadata={(event) => {
            const { videoHeight, videoWidth } = event.currentTarget;
            if (videoWidth > 0 && videoHeight > 0) {
              onVideoDimensionsChange?.(videoWidth, videoHeight);
            }
          }}
        />
        {!isReady && (
          <div className={styles.placeholder}>
            <p className={styles.placeholderTitle}>
              {isRequesting ? "Requesting camera access" : "Camera preview is off"}
            </p>
            <p className={styles.placeholderText}>
              {isRequesting
                ? "Approve browser permission to start the live preview."
                : "Start the camera to prepare capture preview."}
            </p>
          </div>
        )}
      </div>

      {hasError && errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}

      {showControls && <div className={styles.actions}>
        <button
          className={styles.primaryAction}
          type="button"
          onClick={onStart}
          disabled={isRequesting}
        >
          {isReady ? "Restart Camera" : "Start Camera"}
        </button>
        <button
          className={styles.secondaryAction}
          type="button"
          onClick={onStop}
          disabled={!stream && !isRequesting}
        >
          Stop Camera
        </button>
      </div>}
    </section>
  );
}
