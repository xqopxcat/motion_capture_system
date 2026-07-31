# Task 69 Review Checklist

## Composition and state

- [x] One stable Capture viewport exists.
- [x] Every Product State maps exhaustively to one Stage mode.
- [x] Task 68 controller remains the sole lifecycle authority.
- [x] CapturePage is composition-focused and derives no lifecycle booleans.
- [x] Live and review surfaces are mutually exclusive and conditionally mounted.
- [x] Recorded Preview no longer appears below the camera.
- [x] One stable primary action footer exists.
- [x] Legacy Start/Stop Camera, Start/Stop Recording, Upload, Close/Clear Preview controls are absent.

## State presentation

- [x] Permission/request/preparation states use the common viewport.
- [x] Ready, Countdown and Recording retain one live surface.
- [x] Countdown and REC/timer are viewport overlays.
- [x] Reviewing uses recorded video/pose in the same viewport.
- [x] Retake and Save Recording emit controller-provided intents.
- [x] Interrupted review warning is rendered.
- [x] Saving disables review interactions and displays progress.
- [x] Completed displays View Record.
- [x] Failed displays Retry only when controller marks it retryable.

## Compatibility and scope

- [x] Review play/pause/seek and nearest-frame lookup remain.
- [x] Task 67 preview/live/long-task diagnostics remain.
- [x] Hidden inactive media/render components are unmounted.
- [x] Raw Pose, MediaRecorder, Saving/retry/finalization behavior is unchanged.
- [x] No API/schema/backend/storage/dependency change.
- [x] No scheduling, smoothing, Worker, angles or renderer migration.
- [x] Task 70 not started.

## Evidence

- [x] Stage-mode/exclusivity/action/accessibility tests pass.
- [x] Task 67 and Preview-sync focused tests pass.
- [x] TypeScript and production build pass.
- [ ] Interactive local visual smoke test: blocked because in-app Browser could not reach host loopback.
- [ ] Physical camera/review playback and device layouts validated.
- [ ] Task 71 final visual, responsive, safe-area and transition QA completed.

Task 69 is implementation-complete with the full frontend suite passing; unchecked visual/device
items are explicit later validation, not authorization for Task 70.
