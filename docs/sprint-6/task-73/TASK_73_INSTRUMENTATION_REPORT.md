# Task 73 — Instrumentation Report

Task 67 fields retain their prior definitions. Task 73 adds development-only snapshot counters:

- `candidateFrameCount`
- `coalescedCandidateCount`
- `pendingFrameReplacementCount`
- `staleResultRejectedCount`
- `acceptedResultPublicationCount`
- `producerPauseCount` / `producerResumeCount`
- `sourceFrameToPublishLatencyMs`

Existing inference attempt/completion/failure, pending/max pending, effective inference FPS, durations, camera observations, pose age, camera-to-overlay proxy latency, render cost, long tasks, and `droppedOrSupersededFrameCount` remain available. Coalesced and stale are distinct and do not redefine the old dropped/superseded counter. There is no per-frame console logging.

Deterministic evidence demonstrates maximum observed scheduler concurrency `1` and capacity `1`. The checked environment has no physical camera run, so no claim is made about device FPS, latency, jitter, or user-visible improvement. A before/after physical measurement can use the unchanged Task 67 protocol and copied diagnostics JSON.
