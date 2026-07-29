# Sprint 6 — Capture State Machine and UX Contract

| Item | Value |
| --- | --- |
| Task | 66 — Capture Contract and Implementation Plan |
| Status | Approved |
| Scope | Frontend product/runtime contract only |
| Evidence date | 2026-07-30 |
| Depends on | Sprint 5 Tasks 62–65, frontend and UI/UX architecture specifications |

## 1. Purpose

This document defines the deterministic product state machine for the new
Capture experience. It replaces the normal product interaction model based on
separate Start/Stop Camera, Start/Stop Recording, Upload, and Close Preview
buttons.

This contract does not add a persisted Record status. `PermissionRequired`
through `Failed` are frontend runtime states. The only persisted Record statuses
remain `Uploading`, `Processing`, `Ready`, and `Failed`.

## 2. Ownership

One feature-level Capture controller owns:

- the product state and state context;
- camera, recorder, pose-runtime, pose-collection, review, and publish
  orchestration;
- transition guards, repeated-click protection, cleanup, navigation guards, and
  recovery intent;
- the stable primary-action contract exposed to UI components.

The controller composes existing camera, recorder, pose, artifact-preparation,
and Sprint 5 publish capabilities. Presentational components receive state and
callbacks. They do not call APIs or derive lifecycle transitions.

Runtime media, Pose Dataset drafts, Metric Series, and canvas contexts remain in
feature/engine memory and are not stored in Redux. Server resources remain
owned by RTK Query/service boundaries.

## 3. Product states

| State | Purpose | Required context |
| --- | --- | --- |
| `PermissionRequired` | Camera access requires user action or recoverable guidance. | Required reason: `not-requested`, `permission-prompt-required`, `permission-dismissed`, `permission-denied`, or recoverable `device-unavailable`; safe guidance |
| `RequestingPermission` | One `getUserMedia` request is in flight. | Request token; requested device/facing mode |
| `Preparing` | Camera preview may already be usable while video metadata, Pose Engine, and other required recording dependencies initialize. | Candidate stream; camera readiness; motion-tracking readiness; preparation status |
| `Ready` | Live camera and required recording dependencies are ready. | Active stream and video element |
| `Countdown` | A cancellable pre-recording countdown is running. | Deadline; configured duration; active stream |
| `Recording` | MediaRecorder and official raw pose collection are active. | Recording time origin; recorder session |
| `Reviewing` | The completed local video and matching raw Pose Dataset draft are reviewed in the Unified Capture Stage. | Video Blob/object URL; raw pose draft |
| `Saving` | Browser artifacts are prepared and the Sprint 5 create/upload/finalize pipeline runs. | Immutable review snapshot; saving substate; resume state |
| `Completed` | The backend returned persisted status `Ready`. | Ready `recordId` |
| `Failed` | A product operation failed and cannot remain in its originating state. | Failure stage, safe message, retryability, recovery target, optional `recordId` |

`Stopping` is an internal recorder substate, not a product state. While the
recorder stops, the product remains `Recording`, disables the primary control,
and displays finishing feedback. It enters `Reviewing` only after a non-empty
Blob and Pose Dataset draft are available.

## 4. Events

| Event | Meaning |
| --- | --- |
| `ENTER_CAPTURE` | Capture route mounted |
| `ENABLE_CAMERA` | User requests camera access |
| `CAMERA_GRANTED(stream)` | Current request returned a usable stream |
| `CAMERA_REJECTED(error)` | Permission or device acquisition failed |
| `PREPARATION_READY` | Video metadata and required pose/recording readiness passed |
| `PREPARATION_FAILED(error)` | Required preparation failed |
| `RECORD` | User requests countdown |
| `CANCEL_COUNTDOWN` | User cancels countdown |
| `COUNTDOWN_FINISHED` | Active countdown reaches zero |
| `STOP` | User requests recording stop |
| `RECORDING_READY(snapshot)` | Recorder stop produced video and raw pose draft |
| `RECORDING_FAILED(error)` | Recorder or official pose collection failed |
| `RETAKE` | User discards the unsaved review snapshot |
| `SAVE` | User accepts the review snapshot |
| `SAVE_STAGE_CHANGED(stage)` | Internal saving progress changes |
| `SAVE_SUCCEEDED(recordId)` | Finalize returned `Ready` |
| `SAVE_FAILED(error)` | Analysis, creation, upload, or finalization failed |
| `RETRY` | User retries the failure's defined recovery path |
| `VIEW_RECORD` | User opens the Ready Record |
| `CAMERA_SWITCH(device)` | User requests another camera |
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | Document visibility changes |
| `TRACK_ENDED` / `DEVICE_LOST` | Active capture track becomes unusable |
| `ROUTE_LEAVE_REQUESTED` | In-app or browser navigation attempts to leave |
| `UNMOUNT` | Capture route unmounts |

## 5. Transition table

| Current | Event | Guard | Next | Required action |
| --- | --- | --- | --- | --- |
| — | `ENTER_CAPTURE` | prior permission is granted | `RequestingPermission` | Automatically request the preferred camera once |
| — | `ENTER_CAPTURE` | permission is prompt/unknown/cannot be queried | `PermissionRequired` | Set reason to `permission-prompt-required` or `not-requested`; prepare non-camera dependencies; do not repeatedly prompt |
| — | `ENTER_CAPTURE` | permission is denied | `PermissionRequired` | Set reason to `permission-denied`; show browser recovery guidance without promising a new prompt |
| `PermissionRequired` | `ENABLE_CAMERA` | no request in flight | `RequestingPermission` | Start one camera request |
| `RequestingPermission` | `CAMERA_GRANTED` | request token is current | `Preparing` | Attach stream and initialize readiness |
| `RequestingPermission` | `CAMERA_REJECTED` | prompt dismissed or permission denied | `PermissionRequired` | Stop candidate tracks; set the explicit reason; show accurate recovery instructions |
| `RequestingPermission` | `CAMERA_REJECTED` | device temporarily unavailable but recoverable | `PermissionRequired` | Set `device-unavailable`; allow a deliberate retry after guidance |
| `RequestingPermission` | `CAMERA_REJECTED` | unsupported/fatal acquisition error | `Failed` | Store safe failure and recovery target |
| `Preparing` | `PREPARATION_READY` | stream/video, Pose Engine, recorder, and every required Capture dependency are ready | `Ready` | Enable stable Record control |
| `Preparing` | `PREPARATION_FAILED` | camera preview remains usable but pose/tracking dependency failed recoverably | `Failed` or retrying `Preparing` | Keep the usable camera visible with explicit tracking-unavailable context; Record remains disabled |
| `Preparing` | `PREPARATION_FAILED` | camera/required dependency is unusable or fatal | `Failed` | Stop unusable resources |
| `Ready` | `RECORD` | recorder supported; no conflicting operation | `Countdown` | Set deadline and lock camera switching |
| `Countdown` | `CANCEL_COUNTDOWN` | countdown active | `Ready` | Cancel timer; collect no official frames |
| `Countdown` | `COUNTDOWN_FINISHED` | page visible and stream usable | `Recording` | Start recorder and raw pose collection from one logical boundary |
| `Countdown` | `PAGE_HIDDEN` | — | `Ready` | Cancel countdown |
| `Recording` | `STOP` | stop not already requested | `Recording` | Disable Stop; stop recorder and pose collection once |
| `Recording` | `RECORDING_READY` | normal or interrupted snapshot passes the local validation contract | `Reviewing` | Stop live camera/detection; create review URL; attach interruption warning when applicable |
| `Recording` | `RECORDING_FAILED` | — | `Failed` | Stop collection and camera resources |
| `Recording` | `PAGE_HIDDEN` | stop not already requested | `Recording` | Request safe stop; then enter `Reviewing` if output is valid |
| `Reviewing` | `RETAKE` | saving has never started | `Preparing` | Revoke review URL; clear draft; reacquire/restart camera as needed |
| `Reviewing` | `SAVE` | valid immutable snapshot; no save in flight | `Saving` | Freeze snapshot; begin `Analyzing` |
| `Saving` | `SAVE_STAGE_CHANGED` | active operation token | `Saving` | Update substate only |
| `Saving` | `SAVE_SUCCEEDED` | backend status is `Ready` | `Completed` | Retain `recordId`; clear unsaved guard |
| `Saving` | `SAVE_FAILED` | — | `Failed` | Preserve resume context and local snapshot |
| `Failed` | `RETRY` | retryable and recovery target valid | target state | Execute the stage-specific retry contract |
| `Completed` | `VIEW_RECORD` | `recordId` exists | route leave | Navigate to `/records/{recordId}` |
| `Ready` | `CAMERA_SWITCH` | not counting down/recording | `Preparing` | Acquire replacement stream and dispose old stream safely |
| any active state | `TRACK_ENDED` / `DEVICE_LOST` | before review | `Failed` | Stop recording if necessary and release resources |
| any | `UNMOUNT` | — | — | Execute cleanup contract |

## 6. Invalid transition policy

Invalid events are ignored without side effects in production and may be
reported to development diagnostics. They must never create a Record, restart an
upload, or allocate another stream.

Examples:

- `RECORD` outside `Ready`;
- `SAVE` outside `Reviewing`;
- a second `STOP` after stop has been requested;
- `RETAKE` after `Saving` begins;
- `CAMERA_SWITCH` during `Countdown`, `Recording`, or `Saving`;
- `RETRY` without a retryable failure;
- stale async completion carrying an obsolete operation/request token.

Every asynchronous operation receives an identity token. Results from cancelled
or superseded operations are disposed and do not transition state.

## 7. Entry, exit, and cleanup

| State | Entry | Exit/cleanup |
| --- | --- | --- |
| `PermissionRequired` | Preload safe non-camera dependencies where supported | No active camera request may remain |
| `RequestingPermission` | Issue exactly one camera request | Stop stale candidate streams |
| `Preparing` | Attach stream, await metadata, initialize/warm Pose Engine | Dispose failed or replaced stream/engine |
| `Ready` | Start live pose feedback | Stop detection when leaving for review/saving/unmount |
| `Countdown` | Start monotonic deadline timer; keep live feedback | Cancel timer on every exit |
| `Recording` | Start recorder and official collection | Stop timer, recorder, and collection exactly once |
| `Reviewing` | Stop live stream; show recorded video in the same stage | Revoke object URL on retake, completion, or unmount |
| `Saving` | Freeze inputs and resume context; prevent duplicate intent | Do not erase resume context on failure |
| `Completed` | Hold only navigation-safe completion context | Release remaining local Blob/object URL after navigation or explicit new capture |
| `Failed` | Preserve only resources required by the recovery target | Non-recoverable resources are released immediately |

On `UNMOUNT`, cancel countdown/render loops, stop active tracks, stop/dispose the
Pose Engine, stop official pose collection, request recorder stop if active,
invalidate async tokens, and revoke object URLs when safe. Network requests
already accepted by the backend may complete, but their stale callbacks cannot
update an unmounted controller.

## 8. User action contract

| State | Primary action | Secondary action | Notes |
| --- | --- | --- | --- |
| `PermissionRequired` | Enable Camera | Back | Permission help is contextual, not another primary button |
| `RequestingPermission` | None | Cancel/Back where safe | Repeated camera requests are disabled |
| `Preparing` | None | Back | Show preparation status |
| `Ready` | Record | Camera switch; overlay/settings controls | No normal Stop Camera button |
| `Countdown` | Cancel | None | Record control stays in the same physical location |
| `Recording` | Stop | None | Overlay toggles may remain usable if they do not affect stored raw pose |
| `Reviewing` | Save Recording | Retake | Live view is replaced in the Unified Capture Stage |
| `Saving` | None | None | Show friendly substage progress; navigation is guarded |
| `Completed` | View Record | Capture Another | Record is already `Ready` |
| `Failed` | Retry, only when retryable | Back/Records where safe | Never claim success optimistically |

The Record/Stop control occupies one stable location. `Save Recording`, not
`Upload`, is the product language; upload remains an internal saving stage.

## 9. Camera lifecycle

### 9.1 Permission and automatic preparation

- On route entry, the controller begins loading non-camera dependencies.
- If the browser reports camera permission already granted, it automatically
  requests and prepares the preferred camera.
- If permission is `prompt`, unknown, or unavailable through the Permissions
  API, the product shows `PermissionRequired` and uses the `Enable Camera` user
  gesture. It does not create a prompt loop on every mount.
- If permission is denied or a prompt was dismissed, `PermissionRequired`
  retains the explicit reason and accurate recovery guidance. The UI must not
  imply that Enable Camera can always reopen a browser-controlled prompt.
- A recoverable unavailable-device condition may also remain
  `PermissionRequired` with reason `device-unavailable`. Unsupported or fatal
  acquisition failures enter `Failed`.
- A rejected request stops every candidate track and never leaves a hidden live
  stream.

### 9.2 Camera preview and Pose readiness

- Camera preview availability and recordability are separate facts. The camera
  may be visible while the Pose Engine is still preparing.
- Sprint 6 requires Pose Engine readiness before entering recordable `Ready`
  because every valid Capture must produce the required Pose Dataset.
- Record remains disabled until the camera, recorder, Pose Engine, and all
  required Capture dependencies are ready.
- If camera preview works but motion tracking preparation fails, the stage
  remains visually truthful: it may continue showing the camera with an
  explicit tracking-unavailable state. It must not become a blank camera-error
  screen or imply that recording is available.
- Exact presentation and retry controls belong to Tasks 68–71.

### 9.3 Ready, countdown, and recording

- `Ready` and `Countdown` retain the same stream and continue live pose/framing
  feedback.
- Camera switching is allowed only from `Ready`.
- `Recording` retains the stream until recorder stop completes.
- A track ending during recording triggers one safe stop attempt. Valid partial
  output may be reviewed with an interruption warning; empty/invalid output
  enters `Failed`.

### 9.4 Review, interruption, and retake

- Entering `Reviewing` stops live pose detection and all camera tracks to avoid
  an unexplained active-camera indicator.
- Recorded video replaces the live camera inside the Unified Capture Stage.
- An interrupted recording may enter `Reviewing` only when later implementation
  validation confirms a non-empty video Blob, duration above the approved
  minimum parameter, a valid Raw Pose Dataset draft, alignable video/pose
  timing, and usable required local snapshot inputs.
- Valid interrupted review displays an explicit warning and permits Retake or
  Save Recording. Invalid, empty, unalignable, or artifact-incomplete partial
  output enters `Failed` and is never presented as a successful review.
- Task 68 owns the minimum-duration parameter. Task 66 does not guess its value.
- `RETAKE` is available only before saving. It clears video, raw pose frames,
  pose draft, review playback state, title edits that are explicitly
  capture-scoped, and local publish progress. It then reacquires or restarts the
  camera through `Preparing`.
- Once a persisted Record has been created, Retake is not offered as a silent
  discard. Cleanup of such a Record requires the existing owned Record deletion
  contract.

### 9.5 Camera switching

The controller enumerates/selects devices through the camera boundary. A switch
request acquires the replacement camera in `Preparing`; only after a valid
replacement exists is the prior stream released where browser resource limits
permit. If parallel acquisition is not supported, the old stream is released
first and failure returns to a recoverable camera state. Device IDs are runtime
preferences, not persisted Record data.

## 10. Countdown contract

- Initial MVP duration: **3 seconds**.
- The duration is a controller configuration constant, not a user setting in
  Task 66. Its API must allow a later approved configurable value.
- Countdown is cancellable and returns to `Ready`.
- Live pose and framing feedback continues.
- Countdown frames never enter the authoritative Pose Dataset.
- The countdown uses a monotonic deadline (`performance.now`) rather than
  decrementing an assumed one-second interval.
- At zero, the controller establishes one logical `recordingOriginMs`, starts
  MediaRecorder, and starts official pose collection against that boundary in
  the same transition. Each official pose timestamp is normalized to this
  origin.
- The first video byte and first pose sample cannot be made physically atomic
  by browser APIs. Task 67 must measure and record start skew; it must not hide
  the limitation by assigning unrelated origins.
- If the page becomes hidden during countdown, countdown is cancelled and the
  controller returns to `Ready`.

## 11. Saving substate and retry contract

`Saving` is the product state. Its internal substate is one of:

```text
Analyzing
CreatingRecord
UploadingArtifacts
Finalizing
```

`UploadingArtifacts` also carries the current artifact and completed-artifact
set. Friendly progress may name Video, Pose Dataset, Metric Series, and
Thumbnail without exposing signed URLs or storage paths.

| Failure | Persisted Record exists? | Retry action |
| --- | --- | --- |
| Browser analysis/artifact preparation | No | Re-run analysis from the immutable review snapshot; do not create a Record first |
| Record creation fails before the request could be accepted | No | A deliberate user retry may create the Record |
| Record creation outcome is ambiguous because the connection failed after request submission but before `recordId` was received | Unknown | Do not automatically create again. Report the known API limitation and require the future additive Record-create idempotency dependency |
| Failure after `recordId` is known | Yes | Reuse the same `recordId`; never call create again |
| Partial artifact upload/completion | Yes | Retain `completedArtifacts`; obtain fresh signed URLs only for incomplete artifacts and repeat idempotent completion as needed |
| Retryable persisted lifecycle `Failed` | Yes | Call `POST /records/{id}/retry` once, return persisted status to `Uploading`, then resume/finalize |
| Finalization transport failure | Yes | Re-fetch Record detail before deciding: `Ready` completes, `Uploading` retries finalize, retryable `Failed` uses lifecycle retry, `Processing` follows Task 63 timeout/finalize rules |
| Non-retryable failure | Maybe | No Retry action; show safe next step and preserve server truth |

The existing page-local Sprint 5 resume state remains the minimum compatibility
contract:

- `recordId`;
- completed artifact types;
- whether an explicit lifecycle retry is required.

It does not persist signed URLs, credentials, or artifact bytes. Tasks 68 and
70 must reuse this semantic contract even if its type/controller location
changes.

## 12. Navigation, page visibility, and orientation

### 12.1 Navigation

- `PermissionRequired`, `Ready`, `Completed`, and non-recoverable `Failed` may
  leave without an unsaved-work confirmation after normal cleanup.
- `Countdown` is cancelled before leaving.
- `Recording` requires confirmation for in-app navigation. Confirmed leave
  safely stops and discards the local session; cancelled leave keeps recording.
- `Reviewing` requires confirmation because video/pose data is unsaved.
- `Saving` blocks in-app navigation and registers a browser `beforeunload`
  warning. This cannot guarantee completion after hard close.
- A failure with a local review snapshot or resumable Record also requires
  confirmation before losing page-local recovery context.

### 12.2 Page visibility

- Hidden during `PermissionRequired`, `Preparing`, or `Ready`: stop render work;
  keep or reacquire the stream according to browser behavior, and revalidate on
  visibility.
- Hidden during `Countdown`: cancel to `Ready`.
- Hidden during `Recording`: request safe stop because background camera and
  timing behavior is not portable. Enter `Reviewing` with an interruption
  warning only if the partial-output validation contract passes; otherwise
  enter `Failed`.
- Hidden during `Reviewing`: pause review playback.
- Hidden during `Saving`: saving may continue; UI reconciles on return.

### 12.3 Orientation

Orientation changes do not reset product state or restart recording. The Unified
Capture Stage resizes its viewport and rendering transform while preserving
video/pose time origin. Orientation lock is not required for MVP. The UI may
recommend landscape for full-body capture but must remain operable in portrait.

## 13. Failure model

Failure context contains:

- product operation (`permission`, `preparation`, `recording`, `analysis`,
  `record-creation`, `artifact-upload`, `finalization`, `device`, or
  `navigation-recovery`);
- safe user message;
- retryable boolean;
- recovery target/event;
- optional known `recordId`;
- optional completed artifacts;
- optional persisted failure code/status.

Provider errors, signed URLs, storage paths, and credentials are not displayed
or persisted in frontend failure context.

## 14. Implementation boundaries

- Capture controller: orchestration and product state.
- Camera hook/adapter: stream acquisition, switching, track events, disposal.
- Recorder hook/adapter: MediaRecorder session and Blob production.
- Pose Engine: raw inference only; no React, Redux, RTK Query, or UI.
- Pose quality pipeline: future runtime transformation boundary.
- Visualization Engine: render-only.
- Upload/Record services: server requests and server-state invalidation.
- Artifact PUT transport: dedicated upload transport owned below the UI
  component boundary.
- Backend: authoritative Record lifecycle and ownership.

Task 66 changes documentation only. This contract is approved and Task 66 is
closed. Task 67 remains a separate task and is not started by this approval.

## 15. Approved and deferred decisions

Approved:

1. Automatically prepare the camera on entry only when permission is already
   granted; otherwise use explicit `PermissionRequired` reason/context and an
   Enable Camera gesture.
2. Pose Engine readiness is required for recordable `Ready`, while usable camera
   preview may remain visible during preparation or tracking failure.
3. Hidden countdown cancels to `Ready`; hidden recording requests one safe stop
   and never attempts unsupported background capture.
4. A valid interrupted recording may be reviewed with a warning; invalid partial
   output enters `Failed`.
5. An ambiguous Record-create outcome must never trigger silent duplicate
   creation or unlimited retry.

Deferred dependency:

- Additive Record-create idempotency using a client-generated capture session
  identifier or idempotency key so the backend can return the same owned Record
  for the same user/key. This requires a separately approved API/backend task;
  Task 66 changes no API contract.
