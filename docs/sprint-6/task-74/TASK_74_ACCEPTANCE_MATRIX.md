# Task 74 — Acceptance Matrix

Environment: Windows workspace; Node/Vitest/Vite; Codex in-app browser; local Vite `127.0.0.1:5173`; unauthenticated; no accessible physical camera/backend session.

| State | Initial/action | Expected state and UI | Camera/Pose | Persistence | Navigation/diagnostics | Evidence | Result / remaining risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PermissionRequired | route entry / request | dominant Enable camera action | no stream before intent | none | unprotected | state/stage tests | Automated PASS; physical prompt unavailable |
| RequestingPermission | permission intent | disabled requesting status | one stream request | none | unprotected | state/presentation tests | Automated PASS; browser permission unavailable |
| Preparing | permission granted | camera/pose preparation status | initialize once, readiness gated | none | unprotected | reducer/controller contract | Automated PASS; hardware unavailable |
| Ready | prepared | live 16:9 workspace, Record dominant | camera + latest valid skeleton; stale clear | none | unprotected; diagnostics gated | stage/render tests | Automated PASS; alignment manual gap |
| Countdown | Record / Cancel or hidden | readable countdown; Cancel | live continues; no duplicate recording | none | unprotected | state hidden/cancel tests | Automated PASS; tab behavior physical gap |
| Recording | countdown completes / Stop or hidden | REC, timer, Stop | one producer; bounded inference; pose collection | MediaRecorder + accepted 33-joint results | unprotected; counters | state/scheduler/schema tests | Automated PASS; real recording gap |
| Reviewing | recorder finalizes / edit, seek, retake, save | recorded review only; Save/Retake; warning if interrupted | playback-nearest pose; no live surface | unsaved immutable review snapshot | discard guard | stage/guard/sync tests | Automated PASS; actual playback gap |
| Saving | Save / progress or retry | approved stage copy; controls disabled; no fake % | live off; review frozen | create once, resume artifacts, finalize to Ready | saving guard | publisher/state/guard tests | Automated PASS; backend upload gap |
| Completed | backend Ready / View Record | saved title and View Record; no stale failure/saving UI | none | known Ready record | no block; route intent | state/stage tests | Automated PASS; actual navigation gap |
| Failed | stage failure / retry when allowed | safe message and target-specific retry; nonretryable disabled | lifecycle-owned cleanup | known record/resume retained where valid | block only if controller flag requires | state/publisher/stage tests | Automated PASS; provider error rendering not physically induced |

Across all states: API/backend/schema/storage are unchanged; diagnostics remain development-only; unavailable physical checks are not marked passed.
