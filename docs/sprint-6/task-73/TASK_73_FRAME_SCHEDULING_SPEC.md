# Task 73 — Frame Scheduling Specification

## Production policy

`LATEST_FRAME_SCHEDULING_POLICY` is a runtime-only, latest-frame-wins contract: one active inference, one pending candidate, replacement of an older pending candidate, and publication of only the latest valid result. There is no general queue.

The authoritative producer prefers `HTMLVideoElement.requestVideoFrameCallback`; `requestAnimationFrame` is the explicit fallback. The fallback suppresses duplicate `currentTime` observations. Both paths use one recursive callback and a 66 ms named minimum interval when idle, preserving the conservative Task 67 baseline cadence. A fresh pending frame is started immediately when active inference completes.

## Frame classes

- Candidate: a producer observation; it may be cadence-skipped or coalesced.
- Inferred: a candidate accepted by the scheduler and passed to Pose Engine.
- Persisted: a successful accepted result collected during Recording; no candidate creates a synthetic pose frame.
- Displayed: the latest valid successful result published to React and the existing Canvas owner.

Video recording remains owned by MediaRecorder and is independent of candidate dropping. Pose Engine, `pose.v1`, 33-landmark Raw Pose, source timestamps, and persisted frame indexing are unchanged.

## Error and render policy

The scheduler always releases its slot and can consume the newest pending candidate after a recoverable rejection. Product-state failure remains controller/pipeline policy; the current MediaPipe pipeline continues to treat a detection exception as fatal. Exactly one React publication occurs per valid result. No landmark-level state, second render loop, cancellation assumption, smoothing, angles, Worker, or Task 74 work is introduced.
