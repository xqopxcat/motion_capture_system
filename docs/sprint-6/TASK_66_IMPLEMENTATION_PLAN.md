# Task 66 — Capture Contract Implementation Plan

| Item | Value |
| --- | --- |
| Status | Approved — Task 66 complete |
| Task type | Contract, inventory, and later-task plan |
| Evidence date | 2026-07-30 |

## 1. Goal

Provide approved state, lifecycle, retry, pose-authority, ownership, Sprint
boundary, and implementation sequencing detail for the Capture Experience and
Pose Quality work. Task 66 creates documentation only.

## 2. Approved Sprint boundaries

### Sprint 6 — Capture Experience Foundation

Goal:

> Make Capture a simple, visually complete, product-quality camera experience
> across Mobile, Tablet, and Desktop, while preserving Sprint 5 lifecycle
> behavior and establishing measurable pose-runtime baselines and scheduling
> improvements.

Sprint 6 includes:

- Capture state-machine implementation;
- Unified Capture Stage;
- complete Capture visual and interaction redesign;
- Review, Save, Retake, Retry, and completion flow;
- Mobile/Tablet First responsive product behavior;
- Production Display Skeleton Profile;
- existing-runtime instrumentation baseline;
- latest-frame-wins scheduling and bounded backpressure;
- dedicated Sprint closure validation.

Sprint 6 does not include:

- Temporal Stabilization;
- live angle calculation or labels;
- production Worker migration;
- Realtime/Final dual-profile production adoption;
- a filtered-pose artifact;
- a new Pose Engine.

### Sprint 7 — Pose Quality & Live Analysis

Goal:

> Use Sprint 6 baseline evidence to improve pose stability and perceived
> latency, then provide formally defined and trustworthy live motion analysis.

Sprint 7 includes pose-quality target confirmation, stabilization, formal
angle contracts and overlay, bounded execution/profile evaluations, and
physical-device validation.

## 3. Approved Sprint 6 task list

### Task 67 — Existing Runtime Instrumentation & Baseline

- measure inference duration, pose-result age, inference/render FPS,
  camera-to-overlay latency, skipped frames, main-thread long tasks, static
  jitter, queue behavior, and relevant React rerenders;
- capture evidence before replacing the existing Capture UI;
- add development-only diagnostics without exposing them in production UI;
- do not add Worker inference, smoothing, or live angles.

### Task 68 — Capture Controller & State Machine

- introduce the approved discriminated product state/context and reducer;
- migrate orchestration from boolean combinations into explicit events/guards;
- adapt camera, recorder, pose, review, and publish boundaries;
- implement countdown, shared recording origin, repeated-click prevention,
  visibility/navigation/device cleanup, and deterministic recovery;
- preserve Sprint 5 resume semantics and persisted statuses;
- implement approved permission reasons, Pose-readiness gating, hidden-page
  behavior, and interrupted-snapshot validation parameters.

### Task 69 — Unified Capture Stage

- make live camera and recorded review mutually exclusive modes of one stage;
- establish stable Record/Stop control placement;
- remove the normal Start/Stop Camera pair and lower-page Preview flow;
- use controlled presentational components;
- preserve product-state and cleanup ownership in the controller.

### Task 70 — Review, Save & Recovery UX

- implement Save Recording and Retake;
- expose Saving plus friendly Analyzing, CreatingRecord, UploadingArtifacts, and
  Finalizing substates;
- preserve partial artifact completion, Record ID reuse, lifecycle retry, and
  finalization;
- reconcile finalization transport uncertainty through server state;
- report ambiguous Record creation without silently creating another Record;
- guard navigation and present safe recoverable failures.

### Task 71 — Responsive Capture Product UI

This is a complete Capture visual and interaction redesign, not a CSS
media-query task.

Required implementation coverage:

- Camera viewport composition;
- stable Record/Stop control;
- recording timer and REC state;
- overlay controls;
- camera switch control;
- permission states;
- no-camera/device states;
- tracking unavailable state;
- Review state;
- Saving state;
- Completed state;
- Failed/retry state;
- Mobile portrait;
- Mobile landscape;
- Tablet;
- Desktop;
- touch targets and safe-area handling;
- visual hierarchy;
- production/debug UI separation;
- accessibility and focus behavior;
- polished transitions where appropriate.

### Task 72 — Production Display Skeleton Profile

- define approved display joints and connections;
- retain all 33 persisted landmarks;
- remove misleading complete-face/finger implications from normal display;
- move Capture toward the shared render-only Visualization Engine;
- ensure Capture, Preview, Viewer, and Compare share display semantics within
  the same application release.

Task 72 does not implement Temporal Stabilization or live angles.

### Task 73 — Frame Scheduling & Backpressure

- implement latest-frame-wins behavior;
- evaluate `requestVideoFrameCallback`;
- separate inference cadence from rendering cadence;
- ensure pending inference cannot grow without bound;
- reduce or document avoidable per-frame React rerenders;
- compare results against Task 67 baseline.

Task 73 does not migrate inference to a production Worker.

### Task 74 — Sprint 6 UX & Performance Validation

Task 74 is the dedicated Sprint 6 closure gate.

Product-flow validation:

- a new user can enable camera, record, stop, review, retake, save, retry, and
  open the created Record without external explanation;
- the normal flow no longer shows Start Camera, Stop Camera, Start Recording,
  and Stop Recording as separate product controls;
- Preview no longer appears below the live Camera View;
- every product state has one clear primary action.

UI-quality validation:

- Capture no longer looks like a placeholder or engineering test page;
- Mobile portrait, Mobile landscape, Tablet, and Desktop receive visual QA;
- production UI hides frame count, dataset pending, raw diagnostics, and
  technical storage terms;
- permission, device, tracking, Saving, Completed, and Failed/retry states have
  formal product UI.

Runtime validation:

- the original implementation baseline exists;
- pending inference cannot grow without bound;
- latest-frame-wins is verified;
- pose-result age is measurable;
- unnecessary per-frame React rerenders are reduced or documented;
- hidden-page behavior matches the approved contract.

Compatibility validation:

- Sprint 5 Record lifecycle, partial-upload resume, artifact completion, retry,
  and finalization remain intact;
- no duplicate Record is created when a `recordId` is known;
- backend `Ready` remains required before frontend `Completed`.

Task 74 does not validate Temporal Stabilization or live angles.

## 4. Approved Sprint 7 task list

### Task 75 — Pose Quality Targets & Data Policy Confirmation

- use Task 67/74 evidence to approve measurable stability and latency targets;
- reconfirm raw/filtered authority and analysis preprocessing before algorithms
  are implemented.

### Task 76 — Pose Temporal Stabilization

- implement approved confidence gating, outlier policy, missing-point policy,
  and selected temporal filter;
- retain raw `pose.v1` authority and runtime-only filtered pose;
- measure jitter reduction against added latency.

### Task 77 — Joint Angle Contract

- define Metric ID, inputs, vertex/reference, coordinate system, unit,
  confidence/missing policy, side, and calculation version;
- route formal calculation through approved Motion Model/Metrics boundaries;
- treat the current direct left-knee calculation as a separately reviewed
  compatibility migration.

### Task 78 — Live Angle Overlay

- add approved overlay modes and labels using supplied metric values;
- keep Visualization Engine render-only;
- share metric meaning across Capture, Preview, Viewer, and Compare;
- handle low confidence and label collision without fabricating values.

### Task 79 — Pose Execution Architecture Evaluation / Spike

- compare main-thread baseline, scheduling improvements, and a bounded Worker
  prototype;
- evaluate frame-transfer, WASM, browser, debugging, and maintenance costs;
- conclude **adopt**, **defer**, or **reject**.

Task 79 does not pre-approve production Worker inference.

### Task 80 — Realtime & Final Analysis Profile Evaluation / Spike

- evaluate whether live feedback and final artifact analysis need different
  model/preprocessing profiles;
- measure latency, quality, processing time, and user-visible consistency;
- conclude **adopt**, **defer**, or **reject**.

Task 80 does not pre-approve a dual-profile production architecture.

### Task 81 — Physical-device Quality Validation

- validate the approved stability, latency, synchronization, recovery, and live
  analysis contracts on representative physical devices and Capture layouts.

## 5. Future Record-create idempotency dependency

The current API cannot safely reconcile:

```text
POST /records
    -> backend creates Record
    -> connection fails before frontend receives recordId
```

Approved handling:

- do not silently create another Record;
- do not add unlimited automatic retry;
- surface the ambiguous outcome as a known API limitation;
- plan a separately approved additive API-hardening task;
- use a client-generated capture session identifier or idempotency key so the
  backend can return the same owned Record for the same user/key.

No task number is assigned here to avoid conflict with the approved Sprint 6/7
sequence. Task 66 does not change API specs or backend source.

## 6. Expected implementation areas

Later tasks may narrow their allowed scope from:

```text
frontend/src/pages/CapturePage/
frontend/src/features/capture/
frontend/src/hooks/useCapturePipeline.ts
frontend/src/hooks/useCameraStream.ts
frontend/src/hooks/useMediaRecorder.ts
frontend/src/components/CameraPreview/
frontend/src/components/SkeletonCanvas/
frontend/src/engines/pose/
frontend/src/engines/motion-model/
frontend/src/engines/metrics/
frontend/src/engines/visualization/
frontend/src/services/recordsApi.ts
frontend/src/services/uploadsApi.ts
frontend/src/types/
```

This is not blanket authorization. Every later task requires its own explicit
allowed files, forbidden changes, and acceptance criteria.

## 7. Controller and migration strategy

Later implementation should use a discriminated union:

```text
CaptureState =
  PermissionRequiredState
  | RequestingPermissionState
  | PreparingState
  | ReadyState
  | CountdownState
  | RecordingState
  | ReviewingState
  | SavingState
  | CompletedState
  | FailedState
```

Migration sequence:

1. Add reducer/type and transition tests without changing visual layout.
2. Map current camera, recorder, pose, preview, and publish events into the
   reducer behind adapters.
3. Establish operation tokens for camera, countdown, recording, and saving.
4. Move current publishing/progress/error/preview/resume interpretation into
   controller context.
5. Derive action enablement from allowed events.
6. Switch the page to the controller.
7. Remove obsolete inert Capture state and duplicated boolean flow only after
   Sprint 5 behavior is characterized and preserved.

At no point may frontend runtime states be added to the backend Record status
enum.

## 8. Reuse and compatibility

Preserve:

- raw `pose.v1`, all 33 landmarks, and immutable pose input;
- four artifact types, SHA-256, signed PUT, and completion rules;
- backend-owned storage paths and lifecycle;
- Record ID/completed-artifact/lifecycle-retry resume semantics;
- only backend `Ready` completes Capture;
- no Pose Dataset, Metric Series, or filtered pose in Redux;
- Filtered Runtime Pose remains runtime-only for Sprint 6/7.

Reuse with controlled adaptation:

- camera request supersession and track cleanup;
- recorder Blob/object URL lifecycle;
- Pose Engine and canonical normalization;
- pose collection/serialization;
- artifact preparation, checksum, thumbnail, and Sprint 5 resume logic;
- RTK Query Record/upload endpoints;
- shared Visualization Engine.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| State migration breaks Sprint 5 retry | Characterization tests before refactor |
| Record duplicated after ambiguous create response | Do not retry ambiguously; add future idempotency dependency |
| MediaRecorder and pose origins drift | One transition-owned origin plus Task 67 measurement |
| Browser visibility/device behavior differs | Approved portable fallback and physical-device validation |
| UI rewrite hides performance regression | Task 67 baseline and Task 74 closure comparison |
| Future smoothing contaminates raw artifact | Approved Pose Quality Data Contract and immutable-input tests |
| Capture and Viewer render differently | Shared Visualization Engine and Task 72 display profile |
| Angle labels redefine metric meaning | Task 77 formal contract before Task 78 overlay |

## 10. Task 66 closure and next task

All Task 66 human decisions required for closure are approved or explicitly
deferred. Task 66 is complete.

The exact next task is:

> **Task 67 — Existing Runtime Instrumentation & Baseline**

Task 67 is not started by this document.

