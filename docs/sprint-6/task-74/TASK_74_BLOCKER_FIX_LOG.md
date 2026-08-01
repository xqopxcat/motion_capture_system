# Task 74 — Blocker Fix Log

## Blockers found

Authenticated manual validation found Live skeleton/video misalignment, incorrect Review contain projection, a non-camera-first mobile composition, missing camera flip and missing Skeleton display toggle.

A second manual pass confirmed that static projection alone was insufficient: Live video advanced beyond the immutable frame used by inference, camera flip restarted stream media time and violated MediaPipe's monotonic timestamp requirement, and Viewer ignored one-frame seeks because its 50 ms dead-zone exceeded a 30 fps frame interval.

## Fixes made

The acceptance fix adds contain projection with actual source geometry, changes Live video to contain, introduces a camera-first mobile layout, adds Ready-only facing-mode flip, and adds a display-only Skeleton toggle for Live/Review. Raw Pose, inference, recording, API/backend/schema/storage, smoothing, angles and Worker remain unchanged.

The follow-up composites the skeleton over the exact immutable frame analyzed by MediaPipe, retains only one bounded display snapshot, stops the old scheduler before camera replacement, gives MediaPipe a separate strictly monotonic runtime clock while preserving source timestamps in published pose results, adds tablet/rotation layout handling, and reduces Viewer seek tolerance to 1 ms.

The display snapshot is released by the overlay effect only after React has stopped rendering that exact frame, avoiding a Flip-time `drawImage` race against a zero-sized canvas. Viewer now ignores stale media callbacks while an explicit frame seek is pending and does not drive controlled seeks backward during active playback.

## Environmental gaps (not product blockers)

- Capture route required authentication; no authenticated session was available.
- No physical camera/human subject was exposed to the browser environment.
- Actual MediaRecorder, Review playback, upload/finalization, Viewer navigation and physical diagnostics could not run.
- Task 67 had no physical baseline, so no numeric before/after comparison is possible.
