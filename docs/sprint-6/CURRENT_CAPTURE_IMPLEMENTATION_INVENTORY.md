# Sprint 6 — Current Capture Implementation Inventory

| Item | Value |
| --- | --- |
| Task | 66 — Capture Contract and Implementation Plan |
| Status | Current implementation evidence |
| Evidence date | 2026-07-30 |
| Source changes | None |

## 1. Purpose

This inventory records the Capture implementation before the new state machine
and Unified Capture Stage. It distinguishes existing reusable behavior from
contract gaps. It does not modify source code.

## 2. Current files and responsibilities

| File/module | Current responsibility | Reuse assessment |
| --- | --- | --- |
| `pages/CapturePage/CapturePage.tsx` | Composes live camera, recording panel, recorded preview, title, publish progress, and navigation | Keep page composition; remove orchestration/state derivation into feature controller later |
| `pages/CapturePage/CapturePage.module.css` | Two-panel desktop layout and separate lower preview/publish panel | Replace in later UI tasks; no Task 66 source change |
| `components/CameraPreview/CameraPreview.tsx` | Owns live video element attachment and exposes Start/Restart/Stop Camera buttons | Reuse video attachment behavior; split product controls out of presentational camera stage |
| `hooks/useCameraStream.ts` | Owns `getUserMedia`, stream state, request supersession, and track cleanup | Strong reusable boundary; extend later for device selection, track-ended, and permission policy |
| `hooks/useMediaRecorder.ts` | Owns MediaRecorder, chunks, timer, Blob, object URL, stop/reset/unmount cleanup | Reuse core recorder lifecycle; place transitions under Capture controller |
| `hooks/useCapturePipeline.ts` | Composes camera, recorder, pose pipeline, and pose collection; derives booleans | Natural migration point to a reducer/controller; current `captureState` is inert |
| `features/capture/usePosePipeline.ts` | Creates Pose Engine, initializes/disposes it, schedules inference, exposes latest result | Reuse engine boundary; scheduling/instrumentation changes belong to later tasks |
| `features/capture/usePoseFrameCollection.ts` | Collects unique pose results during recording and normalizes timestamps | Reuse with a formal shared recording-origin contract |
| `features/capture/buildPoseDatasetDraft.ts` | Copies collected frames into a `pose.v1` draft boundary | Reuse; raw-data semantics must remain |
| `features/capture/poseDatasetV1.ts` | Serializes and validates canonical all-33-landmark Pose Dataset | Reuse unchanged in Task 66 |
| `features/capture/CaptureSkeletonOverlay.tsx` | Bridges current live pose result to Capture-specific canvas renderer | Later migrate to shared Visualization Engine bridge |
| `features/capture/renderCaptureSkeleton.ts` | Draws Capture skeleton with visibility threshold | Current duplicate render path; superseded later by production display profile/shared engine |
| `features/capture/captureSkeletonConnections.ts` | Defines Capture connections including thumb/index/pinky and feet | Later replace as display policy, not Pose storage policy |
| `features/capture/RecordedPosePreview.tsx` | Owns a second video/canvas, local playback state, nearest-frame lookup, and Capture renderer | Reuse playback/nearest-frame ideas; move into Unified Capture Stage/shared visualization later |
| `features/capture/publishCaptureRecord.ts` | Prepares artifacts, creates Record, PUTs signed uploads, completes artifacts, finalizes, and mutates resume state | Preserve Sprint 5 semantics; later separate orchestration from transport and use service boundaries |
| `services/recordsApi.ts` | RTK Query create/finalize/retry/detail/delete endpoints | Reuse for server resource operations |
| `services/uploadsApi.ts` | RTK Query signed URL and completion endpoints | Reuse for server resource operations |
| `engines/pose/MediaPipePoseEngine.ts` | MediaPipe adapter, VIDEO inference, 33-landmark result | Reuse unchanged in Task 66 |
| `engines/visualization/*` and `components/SkeletonCanvas/*` | Shared render-only Viewer/Compare skeleton path | Intended future Capture rendering boundary |
| `types/runtime.ts` | Declares a coarse `CaptureRuntimeState` union | Replace/extend later with the approved product state/context contract |

## 3. Current state ownership

### 3.1 Camera

`useCameraStream` owns:

- `idle`, `requesting`, `ready`, `permission-denied`, `unsupported`, and
  `error`;
- current `MediaStream`;
- request supersession through `requestIdRef`;
- stopping all tracks on stop, replacement, stale completion, and unmount.

`CameraPreview` owns the live `<video>` element and attaches `srcObject`.
`CapturePage` exposes the camera start/stop controls.

There is no automatic route-entry camera preparation, permission-state query,
camera switch, device-loss handler, visibility policy, or product-level
transition contract.

### 3.2 Recording

`useMediaRecorder` owns:

- `idle`, `unsupported`, `recording`, `stopping`, `recorded`, and `error`;
- MediaRecorder instance/chunks;
- elapsed timer;
- recorded Blob and object URL;
- reset and unmount cleanup.

The hook prevents a second start while its recorder is already recording.
`CapturePage` independently renders Start Recording and Stop Recording buttons
from derived booleans.

There is no countdown. The recorder start and pose collection start are coupled
indirectly through a React effect observing `recording`.

### 3.3 Pose detection and collection

`usePosePipeline` owns Pose Engine status and current result. It:

- initializes after the camera becomes ready;
- starts detection after engine/video readiness;
- uses `requestAnimationFrame`;
- enforces a 66 ms minimum detection interval (about 15 FPS maximum);
- prevents overlapping detection with `isDetectingFrameRef`;
- exposes an unfiltered latest MediaPipe-normalized result through React state.

`usePoseFrameCollection` owns raw collected frames in refs and count in state.
`useCapturePipeline` starts collection when recording status becomes
`recording`, using `video.currentTime` or `performance.now` as the start
timestamp. It stops collection when recording ends and builds a draft.

The current design has no explicit shared start transaction or measured skew
between MediaRecorder and pose collection. There is no countdown exclusion
because countdown does not exist.

### 3.4 Preview

`useMediaRecorder` owns the recorded Blob/object URL.
`RecordedPosePreview` owns separate review playback state and a separate
video/canvas DOM tree. `CapturePage` conditionally adds it below the live
Capture workspace.

`Clear Preview` calls `resetCapture`, which:

- revokes/clears the recording result;
- clears publish resume state and visible publish failure/progress.

It does not formally transition/reacquire a camera because no product state
machine exists.

### 3.5 Publishing

`CapturePage` owns:

- record title;
- `isPublishing`;
- publish progress and error;
- mutable `CapturePublishResumeState` in a ref;
- navigation to Viewer on `Ready`.

`publishCaptureRecord` owns the orchestration:

1. serialize `pose.v1`;
2. create/reuse Record;
3. prepare Metric Series/Summary, video, and thumbnail;
4. calculate four SHA-256 checksums;
5. request signed URLs;
6. direct PUT to GCS;
7. complete each artifact;
8. lifecycle retry when required;
9. finalize and require `Ready`.

The browser's current "analysis" preparation happens after Record creation,
despite a safer future retry contract preferring analysis before create.

## 4. Current button-driven flow

```text
Start Camera / Restart Camera
    + Stop Camera
        |
        v
Start Recording
    + Stop Recording
        |
        v
Recorded Preview appended below live camera
    + Clear Preview
    + Save Record
```

The live camera and review surfaces coexist vertically. Camera and recorder
controls are separate pairs. The UI exposes engineering statuses such as pose
frame count and dataset pending state.

## 5. Current derived booleans and state mismatch

`useCapturePipeline` derives:

- `isRecording`;
- `isStoppingRecording`;
- `isCameraReady`;
- `hasRecordedPreview`;
- `canStartCamera`;
- `canStopCamera`;
- `canStartRecording`;
- `canStopRecording`.

`CaptureRuntimeState` declares `idle`, `recording`, `analyzing`, `uploading`,
`completed`, and `failed`, but `useCapturePipeline` initializes it once to
`idle` and never updates it. Therefore it is not the current source of truth.

The effective product state is an implicit Cartesian product of:

- camera status;
- recorder status;
- Pose Engine status;
- presence of video URL;
- presence/frame count of Pose Dataset draft;
- `isPublishing`;
- publish progress stage;
- publish error;
- resume-ref contents.

Contradictory or underspecified combinations are possible because there is no
single reducer/transition authority.

## 6. Sprint 5 retry/resume behavior

Existing behavior that must be preserved:

- `recordId` is stored after successful creation;
- completed artifact types are stored in a `Set`;
- retry skips completed artifacts;
- signed URLs are not retained;
- a retryable finalization failure sets `lifecycleFailed`;
- the next attempt calls the explicit lifecycle retry endpoint before
  re-finalizing;
- only backend-returned `Ready` navigates to Viewer;
- no production fallback is used.

Current limitations:

- resume context is page-local memory and is lost on reload/route leave;
- a transport failure after backend Record creation but before response receipt
  can make creation outcome ambiguous;
- finalization transport failure is not reconciled through Record detail before
  deciding how to retry;
- `publishCaptureRecord` uses direct API `fetch` despite existing RTK Query
  endpoint modules and the documented UI/service boundary;
- progress stage names do not map to a formal product state/substate model;
- Retake/clear behavior after a Record is created is not formalized.

## 7. Runtime versus persisted state

The current code mostly avoids adding frontend values to the backend status
enum. However, UI publishing state and persisted lifecycle are mixed inside one
publisher function:

- frontend stages (`creating`, `preparing`, artifact uploads, `finalizing`);
- persisted Record ID/status and lifecycle retry;
- direct transport and artifact generation.

The new contract must keep them distinguishable:

```text
Frontend product state: Saving
Frontend saving substate: Analyzing / CreatingRecord /
                          UploadingArtifacts / Finalizing
Persisted Record status: Uploading / Processing / Ready / Failed
```

## 8. Visualization and pose gaps

- Capture live and recorded preview use `renderCaptureSkeleton`, not the shared
  Visualization Engine used by Viewer/Compare.
- Capture connections include coarse MediaPipe thumb/index/pinky points.
- all visible landmarks above a fixed `0.35` threshold are drawn.
- no Production Display Skeleton Profile exists.
- no temporal filter, outlier rejection, or missing-landmark policy exists.
- no live angle overlay exists.
- current publisher directly calculates a left-knee 2D angle rather than using
  the formal Motion Model/Metrics Engine contract.

These are inventory findings, not Task 66 implementation authorization.

## 9. Navigation, visibility, and device gaps

No Capture-specific implementation was found for:

- in-app navigation guard;
- browser `beforeunload` guard;
- `visibilitychange`;
- orientation behavior;
- device enumeration/switching;
- track `ended`/device loss;
- background countdown/recording policy;
- persisted recovery after reload.

Unmount cleanup exists independently in camera, recorder, pose, and preview
hooks, but there is no feature-level cleanup order or recovery decision.

## 10. Reuse decisions

Reuse:

- `useCameraStream` acquisition/supersession/cleanup concepts;
- `useMediaRecorder` recorder/Blob/object URL behavior;
- Pose Engine adapter and canonical normalization;
- raw pose frame copying and `pose.v1` serializer/validator;
- nearest-frame lookup;
- Sprint 5 artifact preparation, checksum, upload completion, resume, lifecycle
  retry, and finalization semantics;
- RTK Query Record/upload endpoints;
- shared Visualization Engine/SkeletonCanvas boundary.

Refactor later, without changing Task 66 source:

- move product orchestration into one controller/reducer;
- make camera and recorder hooks event-producing adapters;
- replace Capture-specific renderer with shared Visualization Engine;
- move API calls out of page/component and consolidate transport/service use;
- separate artifact analysis/preparation from Record creation;
- preserve resume state semantics under the new controller.

## 11. No source modification declaration

This inventory was prepared through read-only inspection. No frontend or backend
source file was modified by Task 66.

