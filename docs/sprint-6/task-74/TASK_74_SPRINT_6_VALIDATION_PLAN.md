# Task 74 — Sprint 6 Validation Plan

## Decision rule

The only valid outcomes are `PASS`, `PASS WITH DOCUMENTED PHYSICAL VALIDATION GAPS`, or `FAIL — BLOCKERS REMAIN`. Physical checks are never inferred from unit tests.

## Acceptance matrix dimensions

Every Product State (`PermissionRequired`, `RequestingPermission`, `Preparing`, `Ready`, `Countdown`, `Recording`, `Reviewing`, `Saving`, `Completed`, `Failed`) is evaluated across UI/action, camera/pose, persistence, navigation, responsive/accessibility, skeleton, scheduler/resources, diagnostics, and evidence/result.

## Evidence classes

| Class | Method | Valid for |
| --- | --- | --- |
| Deterministic | Vitest with deferred promises/synthetic pose and render inputs | state, ordering, boundedness, resource ownership, schema, retry/resume |
| Build/static | TypeScript build and source/CSS contract inspection | integration compatibility, breakpoints, safe-area/reduced-motion declarations |
| Browser geometry | Local Vite app in Codex in-app browser | route shell geometry and overflow at named viewports |
| Physical/manual | authenticated browser, real camera, subject, backend/storage | alignment, perceived lag, camera FPS, recording/playback/upload, jitter |

Automated regression and build run first. Browser validation follows. Only Sprint 6 acceptance blockers may be fixed, with a regression test and fix log. No Sprint 7 work is permitted.

## Inspected scope

Required documents `00`, `01`, `02`, `03`, `04`, `05`, `08`, `11`, `13`–`18` and every Task 66–73 document were read. Code inspection covered CapturePage, controller/state machine, UnifiedCaptureStage, navigation guard, responsive CSS, recorder/camera hooks, publisher/finalization, diagnostics, production skeleton renderer/profile, video producer, canvas snapshot, scheduler, Raw Pose collection, Viewer/Compare render integration, and their tests.
