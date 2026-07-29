# Task 66 Review Checklist

| Item | Value |
| --- | --- |
| Task | 66 — Capture Contract and Implementation Plan |
| Status | Accepted and Closed |
| Evidence date | 2026-07-30 |

## 1. Deliverables

- [x] `CAPTURE_STATE_MACHINE_AND_UX_CONTRACT.md` exists and is approved.
- [x] `POSE_QUALITY_DATA_CONTRACT.md` exists and is approved.
- [x] `CURRENT_CAPTURE_IMPLEMENTATION_INVENTORY.md` exists.
- [x] `TASK_66_IMPLEMENTATION_PLAN.md` contains the approved Sprint boundaries.
- [x] `TASK_66_REVIEW_CHECKLIST.md` is resolved.
- [x] `TASK_66_CLOSURE_SUMMARY.md` exists.

## 2. Architecture compliance

- [x] Capture remains Mobile/Tablet First.
- [x] A feature-level controller owns orchestration.
- [x] Components remain controlled/presentational and do not directly call APIs.
- [x] Engines remain independent of React, Redux, and RTK Query.
- [x] Visualization Engine remains render-only.
- [x] Capture is planned to reuse the shared Visualization Engine.
- [x] Pose Dataset, Metric Series, and filtered pose remain outside Redux.
- [x] Raw Pose remains immutable.
- [x] `pose.v1` remains authoritative and preserves all 33 landmarks.
- [x] Production Display Skeleton is a rendering profile, not storage filtering.
- [x] No global Design Doc was automatically modified.

## 3. Product UX contract

- [x] Product states and required context are defined.
- [x] Every state has a primary/secondary action policy.
- [x] Normal flow removes separate Start/Stop Camera and Start/Stop Recording
  product controls.
- [x] Record/Stop has one stable control location.
- [x] Live Camera and Recorded Preview share one intended Capture Stage.
- [x] Retake, Save Recording, Saving, Completed, and Failed/retry are defined.
- [x] Safe repeated-click and stale-operation-token behavior is defined.
- [x] Sprint 6 includes a complete Capture visual and interaction redesign.
- [x] Task 71 covers viewport composition, controls, every product state,
  production/debug separation, device layouts, accessibility, and polished
  interaction; it is not reduced to breakpoint CSS.

## 4. Permission, readiness, and lifecycle decisions

- [x] **Approved:** already-granted permission automatically prepares the
  preferred camera on route entry.
- [x] **Approved:** prompt/unknown/unqueryable permission uses explicit Enable
  Camera and does not repeatedly prompt on mount.
- [x] `PermissionRequired` carries `not-requested`,
  `permission-prompt-required`, `permission-dismissed`, `permission-denied`, or
  recoverable `device-unavailable`.
- [x] Permission-denied UI does not promise that a click can reopen a browser
  prompt.
- [x] Camera preview may be visible while motion tracking prepares.
- [x] Pose Engine readiness is required before recordable `Ready`.
- [x] Tracking failure may retain truthful live camera presentation while
  Record stays disabled.
- [x] Countdown defaults to three seconds, is cancellable, and excludes its
  frames from `pose.v1`.
- [x] One logical recording origin is defined and browser start skew is assigned
  to measurement.
- [x] **Approved:** hidden countdown cancels to `Ready`.
- [x] **Approved:** hidden recording requests one safe stop and never attempts
  unsupported background recording.
- [x] **Approved:** a valid interrupted snapshot may enter Reviewing with a
  warning and Retake/Save Recording actions.
- [x] Invalid interrupted output enters `Failed`.
- [x] Minimum partial-duration threshold is an implementation parameter, not
  guessed in Task 66.
- [x] Route-leave, unmount, device loss, orientation, and cleanup policies are
  defined.

## 5. Sprint 5 lifecycle preservation

- [x] Persisted statuses remain `Uploading`, `Processing`, `Ready`, and `Failed`.
- [x] Backend remains authoritative for storage paths and final status.
- [x] Existing Record ID reuse is preserved.
- [x] Completed-artifact resume semantics are preserved.
- [x] Signed URLs and credentials are not persisted in recovery state.
- [x] Partial upload retry skips completed artifacts.
- [x] Retryable persisted failure uses Task 63 lifecycle retry.
- [x] Backend `Ready` is required before frontend `Completed`.
- [x] No duplicate Record creation is allowed when `recordId` is known.
- [x] **Approved:** ambiguous create outcome never triggers silent duplicate
  creation or unlimited automatic retry.
- [x] Future additive Record-create idempotency is recorded as a hardening
  dependency using a client capture-session identifier/idempotency key.

## 6. Pose authority and consumer policy

- [x] **Approved:** authoritative `pose.v1` is Raw Canonical Pose.
- [x] Readiness/countdown samples are excluded.
- [x] All 33 canonical landmarks remain persisted.
- [x] Filtered Runtime Pose cannot overwrite raw pose.
- [x] **Approved:** Filtered Runtime Pose remains runtime-only for Sprint 6/7.
- [x] No filtered pose is stored in `pose.v1`, Redux, PostgreSQL, or a new
  artifact.
- [x] Live display filtering and formal analysis preprocessing are separate.
- [x] **Approved:** formal metrics use Raw Canonical Pose → versioned analysis
  preprocessing → Motion Model → versioned Metric Definition/Calculator →
  Metric Series → Metric Summary.
- [x] Metric-output changes require versioned semantics.
- [x] The current direct left-knee implementation gap is documented and not
  refactored by Task 66.
- [x] **Approved:** current-release Preview/Viewer/Compare visualization
  consistency is sufficient.
- [x] Preview/Viewer shared-profile migration remains atomic.
- [x] **Deferred:** exact historical visualization reproduction.
- [x] **Deferred:** persisted visualization/filter profile metadata.
- [x] **Deferred:** a versioned derived-pose artifact.

## 7. Approved task boundaries

### Sprint 6 — Capture Experience Foundation

- [x] Task 67 — Existing Runtime Instrumentation & Baseline.
- [x] Task 68 — Capture Controller & State Machine.
- [x] Task 69 — Unified Capture Stage.
- [x] Task 70 — Review, Save & Recovery UX.
- [x] Task 71 — Responsive Capture Product UI.
- [x] Task 72 — Production Display Skeleton Profile.
- [x] Task 73 — Frame Scheduling & Backpressure.
- [x] Task 74 — Sprint 6 UX & Performance Validation.
- [x] Production Display Skeleton belongs to Sprint 6.
- [x] Task 74 is the dedicated Sprint 6 closure gate.

### Sprint 7 — Pose Quality & Live Analysis

- [x] Task 75 — Pose Quality Targets & Data Policy Confirmation.
- [x] Task 76 — Pose Temporal Stabilization.
- [x] Task 77 — Joint Angle Contract.
- [x] Task 78 — Live Angle Overlay.
- [x] Task 79 — Pose Execution Architecture Evaluation / Spike.
- [x] Task 80 — Realtime & Final Analysis Profile Evaluation / Spike.
- [x] Task 81 — Physical-device Quality Validation.
- [x] Temporal Stabilization and Live Angle Overlay belong to Sprint 7.
- [x] Task 79 and Task 80 may conclude adopt, defer, or reject.
- [x] Worker inference and dual-profile production adoption are not pre-approved.

## 8. Task 74 closure coverage

- [x] Product flow includes enable, record, stop, review, retake, save, retry,
  and open Record without external explanation.
- [x] UI validation covers Mobile portrait, Mobile landscape, Tablet, Desktop,
  all formal product states, visual hierarchy, and hidden diagnostics.
- [x] Runtime validation covers baseline, bounded inference, latest-frame-wins,
  pose-result age, rerenders, and hidden-page behavior.
- [x] Compatibility validation covers Sprint 5 lifecycle/resume/finalization and
  backend `Ready`.
- [x] Task 74 explicitly excludes Temporal Stabilization and live angles.

## 9. Scope compliance

- [x] No frontend or backend source code changed.
- [x] No instrumentation was added.
- [x] No state machine or final Capture UI was implemented.
- [x] No Worker, smoothing, new Pose Engine, or live angle was added.
- [x] No Pose schema, API contract, or backend status changed.
- [x] No dependency was added.
- [x] Task 67 was not started.

## 10. Reviewer decision

**Task 66 Accepted and Closed.**

The exact next task is **Task 67 — Existing Runtime Instrumentation & Baseline**.
This checklist does not start Task 67.

