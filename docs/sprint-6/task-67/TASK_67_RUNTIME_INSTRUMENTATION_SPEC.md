# Task 67 Runtime Instrumentation Spec

## Purpose and boundary

This instrumentation observes the pre-optimization Capture runtime. It does not alter the 66 ms
minimum inference interval, `requestAnimationFrame` scheduler, single-in-flight guard, MediaPipe
model, pose data, renderer, recording lifecycle, or publish/retry behavior.

The collector is owned by `features/capture/instrumentation`. High-frequency writes go to plain
counters, refs, a `WeakMap`, and 300-entry ring buffers. Redux, APIs, storage, and the pose engine
have no instrumentation dependency. A React panel reads one snapshot every 500 ms.

## Current runtime characterization

- The browser `<video>` media time is sampled from the existing RAF loop. A changed
  `video.currentTime` while the element is ready is an **observed browser video frame**, not a
  sensor-frame callback.
- The existing RAF loop permits inference only when no inference is in flight and at least 66 ms
  has elapsed. It invokes `PoseEngine.detect()`, whose MediaPipe implementation calls
  `detectForVideo()`.
- A completed result is published through React state. `CaptureSkeletonOverlay` renders in an
  effect keyed by that result; therefore render counters characterize whether results cause React
  reconciliation without introducing another state update.
- While recording, `useCapturePipeline` passes each published result to the existing pose-frame
  collector. Its timestamps remain unchanged.
- Recorded Preview maps `video.currentTime * 1000` to the existing nearest pose frame and retains
  the existing 100 ms acceptance threshold.

No material difference from the Task 66 source inventory was found.

## Timestamp domains and metric definitions

All runtime durations and event correlation use monotonic `performance.now()` milliseconds. Media
alignment uses `<video>.currentTime * 1000`. These domains are not subtracted from one another.

| Group | Measurement |
|---|---|
| Camera | Count/rate and intervals of distinct observed media timestamps; latest media timestamp and `readyState`. “Camera FPS” is a browser media-time observation proxy. |
| Inference | Attempts, completions, failures, scheduler ticks skipped by throttle/in-flight work, completion FPS, duration, current/max in-flight count, and observed source frames superseded before inference. |
| Freshness | Result sequence metadata is stored in a `WeakMap`. Result age is inference-completion-to-canvas-render. Video-frame-to-overlay proxy is browser observation-to-render. Neither is true sensor-to-display latency. |
| Rendering | Canvas render count/FPS/duration, missing-canvas skips, last sequence, and repeated rendering of the same result. |
| React | Development-only invocation counts for `CapturePage`, `useCapturePipeline`, and `CaptureSkeletonOverlay`. Strict Mode may intentionally double development renders. |
| Main thread | Long Tasks API count/duration and overlap with recorded inference/render windows. Unsupported browsers report `supported: false`, not zero availability. |
| Jitter | Unfiltered normalized 2D RMS distance from each landmark’s window centroid, averaged across shoulders 11/12, hips 23/24, knees 25/26, and ankles 27/28. Visibility below 0.5 is excluded and counted. Reset immediately before a stationary window. |
| Preview | Absolute difference between video media time and selected pose timestamp; unavailable selections and consecutive reuse of a pose frame are counted. |

Numeric summaries contain `count`, `min`, `max`, `mean`, and standard deviation. P50/P95 are emitted
only at 20 or more valid samples. Invalid numeric samples are ignored. Rate requires two distinct
timestamps.

## Enablement and lifecycle

Diagnostics are enabled only when Vite development mode is true and either:

- the URL contains `?captureDiagnostics=1`; or
- `VITE_CAPTURE_DIAGNOSTICS=true` is set for the development server.

Production builds and default development URLs render no panel and collector calls return before
mutation. “Reset scenario” clears all bounded samples and counters. “Copy JSON” exports the current
snapshot.

## Limitations and overhead controls

- Browser APIs used here do not reveal camera sensor capture time.
- A skipped count is scheduler ticks rejected by current conditions, not unique dropped camera
  frames. The superseded count is the distinct observed-frame proxy.
- Long-task overlap is correlation, not proof of causation.
- Jitter is meaningful only when the operator runs a stationary scenario.
- Preview reuse is based on render-selection calls, whose frequency includes browser media events.
- Buffers cap at 300 samples, snapshots are throttled, and no per-frame console/network output is
  produced.

