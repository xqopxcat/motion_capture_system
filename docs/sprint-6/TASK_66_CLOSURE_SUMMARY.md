# Task 66 — Closure Summary

## 1. Final status

**Task 66 — Capture Contract and Implementation Plan is Accepted and Closed.**

Task 66 is documentation-only. It does not authorize or begin implementation of
the next task.

## 2. Documents updated

- `CAPTURE_STATE_MACHINE_AND_UX_CONTRACT.md`
- `POSE_QUALITY_DATA_CONTRACT.md`
- `TASK_66_IMPLEMENTATION_PLAN.md`
- `TASK_66_REVIEW_CHECKLIST.md`

`CURRENT_CAPTURE_IMPLEMENTATION_INVENTORY.md` remains unchanged because its
read-only implementation evidence and findings are still accurate.

This closure summary was added:

- `TASK_66_CLOSURE_SUMMARY.md`

## 3. Approved product decisions

- Already-granted camera permission automatically prepares the preferred camera
  on Capture entry.
- Prompt/unknown/unqueryable permission uses `PermissionRequired` and an
  explicit Enable Camera gesture without repeated mount prompts.
- `PermissionRequired` carries an explicit reason and truthful recovery
  guidance.
- Camera preview may be visible during Pose preparation; Record is enabled only
  after every required Capture dependency, including Pose Engine, is ready.
- Hidden countdown cancels to `Ready`.
- Hidden recording requests one safe stop and does not attempt background
  recording.
- Valid interrupted output may enter Reviewing with a warning, Retake, and Save
  Recording; invalid output enters `Failed`.
- Ambiguous Record creation must not silently create another Record or use
  unlimited automatic retries.
- Authoritative `pose.v1.json` is immutable Raw Canonical Pose with all 33
  landmarks; readiness/countdown samples are excluded.
- Filtered Runtime Pose is derived, non-authoritative, and runtime-only for
  Sprint 6 and Sprint 7.
- Current-application-release consistency across Capture Preview, Viewer, and
  Compare is sufficient.
- Formal metrics use versioned analysis preprocessing and versioned Metric
  definitions, independently of live display filtering.
- Sprint 6 includes a complete Capture visual and interaction redesign, not
  only state or responsive engineering.

## 4. Deferred decisions

- Exact historical reproduction of the capture-day visualization profile.
- Persisting visualization/filter profile version metadata.
- Introducing a versioned derived-pose artifact.

These items are outside Sprint 6 and Sprint 7. They may be reconsidered only
when later performance or reproducibility evidence requires them.

## 5. Sprint 6 — Capture Experience Foundation

1. Task 67 — Existing Runtime Instrumentation & Baseline
2. Task 68 — Capture Controller & State Machine
3. Task 69 — Unified Capture Stage
4. Task 70 — Review, Save & Recovery UX
5. Task 71 — Responsive Capture Product UI
6. Task 72 — Production Display Skeleton Profile
7. Task 73 — Frame Scheduling & Backpressure
8. Task 74 — Sprint 6 UX & Performance Validation

Sprint 6 excludes Temporal Stabilization, live angles, production Worker
migration, dual-profile production adoption, filtered-pose artifacts, and new
Pose Engines.

## 6. Sprint 7 — Pose Quality & Live Analysis

1. Task 75 — Pose Quality Targets & Data Policy Confirmation
2. Task 76 — Pose Temporal Stabilization
3. Task 77 — Joint Angle Contract
4. Task 78 — Live Angle Overlay
5. Task 79 — Pose Execution Architecture Evaluation / Spike
6. Task 80 — Realtime & Final Analysis Profile Evaluation / Spike
7. Task 81 — Physical-device Quality Validation

Task 79 and Task 80 may conclude adopt, defer, or reject. They do not pre-approve
Worker inference or dual-profile analysis for production.

## 7. Future Record-create idempotency dependency

The existing API cannot safely reconcile a Record that was created by the
backend when the connection failed before the frontend received `recordId`.

A future separately approved additive hardening task must introduce a
client-generated capture session identifier or idempotency key so the backend
returns the same owned Record for the same user/key.

Until then:

- do not silently create another Record after an ambiguous response;
- do not use unlimited automatic retry;
- never create another Record when `recordId` is already known.

Task 66 changes no API specification or backend contract.

## 8. Source-code confirmation

No frontend or backend source code was modified.

## 9. Sprint-boundary confirmation

Task 67 was not started. No instrumentation, state-machine implementation,
Capture UI implementation, scheduling change, smoothing, Worker code, or live
angle implementation was added.

## 10. Exact next task

> **Task 67 — Existing Runtime Instrumentation & Baseline**

