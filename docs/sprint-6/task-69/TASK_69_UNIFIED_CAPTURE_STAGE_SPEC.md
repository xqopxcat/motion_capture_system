# Task 69 Unified Capture Stage Spec
This task does not redesign the Task 68 state machine/controller, implement Task 70 recovery UX,
perform Task 71 visual/responsive polish, replace the Capture renderer, define Production Display
Skeleton, change scheduling, add smoothing/angles/Worker, or change Pose/API/backend/storage.
## Purpose and ownership

`UnifiedCaptureStage` is a controlled presentation component that gives every Task 68 Product
State one stable viewport and one stable action area. It consumes `CaptureProductState`, the
controller presentation model, media/pose inputs, and controller callbacks. It does not own state,
camera acquisition, MediaRecorder, Pose collection, publishing, APIs, metrics, or Raw Pose.

`CapturePage` remains composition-only: it obtains the Task 68 controller, handles Completed route
navigation, passes controlled inputs/intents into the Stage, and mounts the Task 67 diagnostic
panel once.

## Stage composition

The Stage has four stable regions:

1. state/status header;
2. fixed 16:9 viewport;
3. state message and optional review title/warning;
4. primary/secondary action footer.

Only the viewport content changes. No recorded preview is appended elsewhere on the page.

### Live surface

Preparing with an available stream, Ready, Countdown, and Recording mount exactly one
`CameraPreview` and one `CaptureSkeletonOverlay` in the same positioning container. CameraPreview's
engineering controls are disabled through its existing controlled `showControls={false}` boundary.
Countdown and recording indicators are overlays; the countdown number is `aria-hidden` so its
frequent updates are not announced.

### Review surface

Reviewing and Saving mount exactly one `RecordedPosePreview` in the same viewport region. The
component retains its single RAF playback loop, nearest-frame lookup, media-time mapping, pose
canvas, and Task 67 preview-selection measurement. Saving passes `disabled`, pauses playback,
stops the review RAF loop, removes video from tab order, and disables play/seek controls.

### State surfaces

PermissionRequired, RequestingPermission, Preparing without a stream, Completed, and Failed use a
non-media state surface. Failed displays only the controller's safe message. No provider error,
signed URL, storage path, stack trace, or API detail is accepted by the generic Stage contract.

## Actions and accessibility

The footer remains mounted in every mode. It displays the controller-approved primary action:
Enable Camera, Record, Cancel, Stop, Save Recording, View Record, Retry, or an inert placeholder.
Retake is available only in Reviewing. Buttons use controller enablement; Saving review controls
and title are disabled. Status text uses one polite live region rather than announcing timer ticks.

Normal Stage UI contains no Start/Stop Camera, Start/Stop Recording, Upload, Close Preview, or
Clear Preview controls.

## Instrumentation and performance

Task 67 diagnostics remain mounted once by CapturePage. Live inference/render instrumentation is
unchanged. Recorded Preview retains preview-sync instrumentation. Mutual-exclusive conditional
rendering unmounts the inactive surface, preventing hidden media elements or duplicate render
loops.

## Non-goals

This task does not redesign the Task 68 state machine/controller, implement Task 70 recovery UX,
perform Task 71 visual/responsive polish, replace the Capture renderer, define Production Display
Skeleton, change scheduling, add smoothing/angles/Worker, or change Pose/API/backend/storage.
