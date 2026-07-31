# Task 73 — Frame Scheduling Specification

## Production policy

`LATEST_FRAME_SCHEDULING_POLICY` is a runtime-only, latest-frame-wins contract: one active inference, one pending candidate, replacement of an older pending candidate, and publication of only the latest valid result. There is no general queue.

The authoritative producer prefers `HTMLVideoElement.requestVideoFrameCallback`; `requestAnimationFrame` is the explicit fallback. The fallback suppresses duplicate `currentTime` observations. Both paths use one recursive callback and a 66 ms named minimum interval when idle, preserving the conservative Task 67 baseline cadence. A fresh pending frame is started immediately when active inference completes.

## Stable image contract

The installed MediaPipe 0.10.35 declaration defines `PoseLandmarker.detectForVideo` input as `ImageSource`, aliased to browser `TexImageSource`. Task 73 therefore uses a private `HTMLCanvasElement` per accepted candidate. The producer callback's displayed video image is synchronously copied with `drawImage`; the canvas is never mutated again before inference. MediaPipe receives that canvas together with the same callback `sourceTimestampMs`, so later advancement of the shared video element cannot change the scheduled image.

Canvas capture is synchronous. There is no snapshot Promise, snapshot-completion race, or snapshot queue. Cadence-rejected callbacks allocate no canvas; the scheduler owns at most the active and pending canvas.

## Frame classes

- Candidate: a producer observation; it may be cadence-skipped or coalesced.
- Captured candidate: a candidate admitted past cadence and represented by its private stable canvas.
- Inferred: a candidate accepted by the scheduler and passed to Pose Engine.
- Persisted: a successful accepted result collected during Recording; no candidate creates a synthetic pose frame.
- Displayed: the latest valid successful result published to React and the existing Canvas owner.

Video recording remains owned by MediaRecorder and is independent of candidate dropping. Pose Engine, `pose.v1`, 33-landmark Raw Pose, source timestamps, and persisted frame indexing are unchanged.

## Error and render policy

The scheduler always releases its slot and can consume the newest pending candidate after a recoverable rejection. Product-state failure remains controller/pipeline policy; the current MediaPipe pipeline continues to treat a detection exception as fatal. Exactly one React publication occurs per valid result. No landmark-level state, second render loop, cancellation assumption, smoothing, angles, Worker, or Task 74 work is introduced.
