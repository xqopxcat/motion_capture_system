# Task 73 — Frame Identity and Lifecycle

Each runtime candidate has `{ generation, cameraSessionId, frameSequence }`. `frameSequence` is monotonic within a camera session; `cameraSessionId` increments on each live detection start; `generation` rotates on session change, hidden pause, and disposal. This identity is not persisted and does not alter `pose.v1` frame indexes.

Each admitted identity owns one canvas snapshot created at `observedAtMs` from the video frame identified by `sourceTimestampMs`. The canvas and timestamp travel as one scheduler payload; the shared `HTMLVideoElement` is never queued.

A result publishes only when the scheduler is live, unpaused, its generation and camera session still match, and its sequence is newer than the last publication. Promise completion order is therefore never display authority.

- Hidden: the producer pauses, pending is cleared, and generation rotates. Countdown cancellation and Recording safe-stop remain controller-owned.
- Visible: the existing live lifecycle resumes the same producer without creating a duplicate loop.
- Stop, Retake/session replacement, stream-ended state changes, completion/failure, and unmount: producer and scheduler are disposed by the existing pipeline lifecycle.
- Underlying MediaPipe work is not forcibly cancelled; obsolete completion is measured and ignored.

Pending references are released on replacement, consumption, rotation, pause, and disposal. The active source reference remains only until unavoidable in-flight work settles.

Release clears the private canvas to `0×0`, allowing its backing store to be reclaimed. Replaced or invalid pending frames release immediately. Active frames release in scheduler `finally`, after success/failure and publication decisions, so inference never reads a closed/cleared source. Synchronous capture means stale asynchronous snapshot completion cannot occur; stale asynchronous inference completion remains guarded by generation/session identity.
