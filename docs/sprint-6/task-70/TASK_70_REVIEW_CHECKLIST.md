# Task 70 — Review Checklist

## Review

- [x] Recorded video and synchronized overlay remain in the Unified Stage.
- [x] Play/Pause and seek remain functional in Reviewing.
- [x] Duration and interruption warning are visible.
- [x] Title is controlled, trimmed and frozen at Save.
- [x] Retake and Save are controller intents.
- [x] No legacy Upload or Close Preview action exists.

## Saving and completion

- [x] All four Saving substates have product language.
- [x] Artifact progress is based only on confirmed completions.
- [x] No fake percentage is displayed.
- [x] Review interactions are disabled during Saving.
- [x] Completed requires backend Ready and shows title plus View Record.
- [x] Progress and retry UI are absent from Completed.

## Recovery

- [x] Known `recordId` is reused.
- [x] Confirmed artifacts are skipped.
- [x] Finalization retry uses the same Record.
- [x] Ambiguous creation blocks automatic duplicate creation.
- [x] Retry is explicit and hidden when non-retryable.
- [x] Raw technical exceptions are not presented.

## Architecture and compatibility

- [x] Task 68 remains state authority.
- [x] Task 69 stage remains presentation-only.
- [x] Task 67 instrumentation is preserved.
- [x] Sprint 5 lifecycle and upload contracts are preserved.
- [x] No API/backend/schema/dependency changes.
- [x] No Task 71/72/73, smoothing, angle, Worker or engine work.

## Router navigation follow-up

- [x] Installed React Router 7.18.0 blocker API verified.
- [x] Reviewing and Saving use the controller-derived route-leave flag.
- [x] PUSH/REPLACE cover Link, NavLink and programmatic navigate.
- [x] POP covers browser Back/Forward.
- [x] Stay resets the pending navigation.
- [x] Leave proceeds to the original pending destination.
- [x] Completed and unprotected states do not block.
- [x] Existing beforeunload protection remains active.
- [x] A blocked transition is reset, never proceeded, when controller protection clears.
- [x] The stale confirmation dialog disappears immediately after protection clears.

## Validation record

- [x] Focused capture tests.
- [x] Complete frontend tests: 40 files / 234 tests passed.
- [x] TypeScript project build/typecheck.
- [x] Production Vite build.
- [x] Lint: no lint script exists; record as not applicable.
- [ ] Physical camera/browser review remains environment-dependent.
