# Task 68 Capture Controller Spec

## Responsibility and boundary

`useCaptureController` is the Capture product-lifecycle authority. Camera, MediaRecorder, Pose,
collection, publisher, and Task 67 diagnostics remain adapters with their own low-level resources;
they do not decide the product state. `useCapturePipeline` is retained as a compatibility-named
entry point and delegates to the controller.

The controller owns product state, intents, operation identity, countdown, shared start
transaction, review validation, Saving progression, visibility/device reactions, before-unload
protection, and ordered idempotent cleanup. The page consumes its presentation model and actions.
No frame metric enters the reducer.

## State and context model

`CaptureProductState` is a discriminated union:

- `PermissionRequired`: explicit reason, recoverability, safe guidance.
- `RequestingPermission`: camera operation token and requested device/facing mode.
- `Preparing`: preparation token/session plus stream, video and Pose readiness context.
- `Ready`: active camera session identity.
- `Countdown`: countdown token, monotonic deadline and configured duration.
- `Recording`: recording token, monotonic logical origin, stop-once flag and interruption reason.
- `Reviewing`: immutable validated local snapshot.
- `Saving`: immutable snapshot, save token, Saving substate and Sprint 5 resume context.
- `Completed`: backend-Ready `recordId`.
- `Failed`: stage, safe message, retry policy/target and only recovery-required resources.

The union prevents states such as Ready without a camera session, Reviewing without a video/Pose
snapshot, Saving without resume state, or Completed without a Record ID.

## Events and transition authority

Implemented events are `ENTER_CAPTURE`, `ENABLE_CAMERA`, `CAMERA_GRANTED`, `CAMERA_REJECTED`,
`PREPARATION_READY`, `PREPARATION_FAILED`, `RECORD`, `CANCEL_COUNTDOWN`,
`COUNTDOWN_FINISHED`, `STOP`, `RECORDING_READY`, `RECORDING_FAILED`, `RETAKE`, `SAVE`,
`SAVE_STAGE_CHANGED`, `SAVE_SUCCEEDED`, `SAVE_FAILED`, `RETRY`, `CAMERA_SWITCH`,
`PAGE_HIDDEN`, `PAGE_VISIBLE`, `TRACK_ENDED`, `DEVICE_LOST`, `ROUTE_LEAVE_REQUESTED`, and
`UNMOUNT`.

The pure reducer rejects invalid state/event pairs and token mismatches by returning the identical
state object. Reducer transitions have no browser side effects; the controller executes commands
and converts adapter outcomes to facts.

## Operation identity

Monotonic tokens identify camera, preparation, countdown, recording, review, saving and retry
operations. Facts must carry the active token. Camera acquisition also retains the existing
request-supersession guard; stale streams have their tracks stopped. Countdown callbacks compare
their token and current state. Recorder/review and publisher callbacks compare the active session
and are ignored after unmount. Saving progress/success cannot update another save.

## Camera lifecycle

On entry the controller queries camera permission when supported. `granted` starts one automatic
request; prompt/unknown shows `PermissionRequired`; denied gives browser-setting guidance. An
explicit Enable Camera starts one request. Camera status is translated to controller facts.

`Preparing` attaches the stream, awaits video readiness, and initializes Pose. Ready requires
camera, video and Pose readiness. Camera selection accepts an exact device ID and is guarded to
Ready. Track `ended` enters recoverable device failure before recording or requests one interrupted
stop during recording.

## Countdown and recording origin

`DEFAULT_CAPTURE_COUNTDOWN_MS` is 3000. Countdown uses a `performance.now()` deadline and a short
timeout only to refresh the remaining display. Cancellation/hidden-page exit invalidates the
callback. Pose collection does not start before the active deadline completes.

At completion, one transition creates:

- a monotonic logical origin for controller/MediaRecorder duration;
- a media-time boundary sampled from the video for pose timestamp normalization;
- one recording token used to correlate recorder completion and review construction.

These happen in the same command transaction but are different clock domains. This does not claim
physical atomicity. Stop sets `stopRequested` before issuing recorder/collection stop, so subsequent
Stop intents do nothing. Product state remains Recording until a valid result exists.

## Review snapshot and validation

`MINIMUM_REVIEW_DURATION_MS` is an explicit 500 ms implementation threshold. A review requires:

- non-empty Blob;
- duration at or above the threshold;
- non-empty Raw Pose draft with usable timing;
- object URL;
- recording/review identities and timing context.

Valid interrupted output carries `interruptionReason`; invalid output enters Failed. The snapshot
is frozen and contains only Saving inputs plus Task 67 session correlation. Retake is accepted only
from Reviewing, revokes/reset local recorder output, clears capture-scoped title, and reacquires
through preparation.

## Saving and retry

Saving substates are `Analyzing`, `CreatingRecord`, `UploadingArtifacts`, and `Finalizing`.
Publisher progress maps into this union. Artifact preparation now occurs before Record creation.
Sprint 5 resume retains `recordId`, completed artifact types and lifecycle-failure intent.

- Without a `recordId`, analysis retries from the immutable snapshot.
- With a `recordId`, retries reuse it and skip completed artifacts.
- A network `TypeError` during create marks `creationOutcomeAmbiguous`; retry is disabled to prevent
  silent duplicate creation.
- Retryable persisted Failed continues using the lifecycle retry endpoint.
- A finalization transport failure fetches Record detail: Ready completes; retryable Failed records
  lifecycle retry intent; other states remain explicit failure.
- Only backend Ready dispatches `SAVE_SUCCEEDED`.

## Visibility, navigation and cleanup

Hidden Countdown cancels. Hidden Recording stops once and carries an interruption warning.
Visibility restoration never restarts either. Reviewing playback remains component-owned and is
not automatically played. Saving may continue.

The presentation model exposes `none`, `confirm-unsaved`, or `blocked-saving`; browser
`beforeunload` is installed only when needed. A common in-app router-wide blocker is not present in
the current application architecture, so wiring every sidebar/link transition remains a documented
device/application integration item rather than being hidden in the page.

Unmount invalidates tokens, cancels countdown, stops pose collection/detection/engine, requests
recorder stop, stops camera tracks, and prevents stale publishing callbacks/navigation. Adapter
cleanup remains idempotent and no backend resource is deleted.

## Presentation model

The page receives product state, one primary action/enabled flag, secondary actions, status
label/message, countdown, elapsed time, camera-switch/overlay permissions, and route protection.
It does not interpret camera/recorder combinations to decide Ready, Reviewing, Saving or Completed.
Provider errors, signed URLs and storage paths are not exposed as generic presentation data.

## Instrumentation and non-goals

Task 67 flag, buffers, counters, reset, JSON export and metric definitions are unchanged. Existing
per-frame observation points remain outside controller state.

No Unified Capture Stage, final visual/responsive redesign, renderer replacement, scheduler
optimization, smoothing, confidence filtering, Worker, angles, Pose schema/API/backend status
change, dependency, or Task 69 work is included.

