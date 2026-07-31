import { useEffect, useState } from "react";
import {
  captureRuntimeInstrumentation,
  observeCaptureLongTasks,
} from "./captureRuntimeInstrumentation";
import styles from "./CaptureDiagnosticsPanel.module.css";

function format(value: number | null, unit = "") {
  return value === null ? "unavailable" : `${value.toFixed(2)}${unit}`;
}

export function CaptureDiagnosticsPanel() {
  const [snapshot, setSnapshot] = useState(() => captureRuntimeInstrumentation.snapshot());
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!captureRuntimeInstrumentation.enabled) return;
    const stopLongTaskObserver = observeCaptureLongTasks(captureRuntimeInstrumentation);
    const interval = window.setInterval(() => {
      setSnapshot(captureRuntimeInstrumentation.snapshot());
    }, 500);
    return () => {
      window.clearInterval(interval);
      stopLongTaskObserver();
    };
  }, []);

  if (!captureRuntimeInstrumentation.enabled) return null;

  const reset = () => {
    captureRuntimeInstrumentation.reset();
    setSnapshot(captureRuntimeInstrumentation.snapshot());
    setCopyStatus("");
  };
  const copyReport = async () => {
    const report = JSON.stringify(captureRuntimeInstrumentation.snapshot(), null, 2);
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Clipboard unavailable");
    }
  };

  return (
    <aside className={styles.panel} aria-label="Capture runtime diagnostics">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Development only</p>
          <h2>Capture runtime baseline</h2>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={reset}>Reset scenario</button>
          <button type="button" onClick={() => void copyReport()}>Copy JSON</button>
        </div>
      </div>

      <dl className={styles.metrics}>
        <div><dt>Camera FPS proxy</dt><dd>{format(snapshot.camera.cameraFrameRate)}</dd></div>
        <div><dt>Inference FPS</dt><dd>{format(snapshot.inference.inferenceFPS)}</dd></div>
        <div><dt>Render FPS</dt><dd>{format(snapshot.rendering.renderFPS)}</dd></div>
        <div><dt>Latest inference</dt><dd>{format(snapshot.inference.latestInferenceDurationMs, " ms")}</dd></div>
        <div><dt>Average inference</dt><dd>{format(snapshot.inference.inferenceDurationMs.mean, " ms")}</dd></div>
        <div><dt>Pose result age</dt><dd>{format(snapshot.poseResult.latestPoseResultAgeMs, " ms")}</dd></div>
        <div><dt>Average / P95 age</dt><dd>{format(snapshot.poseResult.poseResultAgeMs.mean, " ms")} / {format(snapshot.poseResult.poseResultAgeMs.p95, " ms")}</dd></div>
        <div><dt>Skipped scheduler ticks</dt><dd>{snapshot.inference.inferenceSkippedCount}</dd></div>
        <div><dt>Observed unprocessed frames</dt><dd>{snapshot.inference.droppedOrSupersededFrameCount}</dd></div>
        <div><dt>Pending / max pending</dt><dd>{snapshot.inference.pendingInferenceCount} / {snapshot.inference.maximumObservedPendingInference}</dd></div>
        <div><dt>Candidates / coalesced</dt><dd>{snapshot.inference.candidateFrameCount} / {snapshot.inference.coalescedCandidateCount}</dd></div>
        <div><dt>Published / stale rejected</dt><dd>{snapshot.inference.acceptedResultPublicationCount} / {snapshot.inference.staleResultRejectedCount}</dd></div>
        <div><dt>Source-to-publish</dt><dd>{format(snapshot.inference.sourceFrameToPublishLatencyMs.mean, " ms")}</dd></div>
        <div><dt>Producer pause / resume</dt><dd>{snapshot.inference.producerPauseCount} / {snapshot.inference.producerResumeCount}</dd></div>
        <div><dt>Long tasks</dt><dd>{snapshot.mainThread.supported === false ? "unsupported" : snapshot.mainThread.longTaskCount}</dd></div>
        <div><dt>Static jitter</dt><dd>{snapshot.jitter.status}: {format(snapshot.jitter.aggregateNormalizedRms)}</dd></div>
        <div><dt>Preview sync mean / P95</dt><dd>{format(snapshot.previewSync.errorMs.mean, " ms")} / {format(snapshot.previewSync.errorMs.p95, " ms")}</dd></div>
        <div><dt>React renders</dt><dd>page {snapshot.react.CapturePage}, overlay {snapshot.react.CaptureSkeletonOverlay}, hook {snapshot.react.useCapturePipeline}</dd></div>
      </dl>
      <p className={styles.note}>
        Sensor capture time is unavailable. Camera FPS and camera-to-overlay values are browser
        media-time/runtime proxies. Reset before each baseline scenario.
      </p>
      {copyStatus && <p className={styles.copyStatus} role="status">{copyStatus}</p>}
    </aside>
  );
}
