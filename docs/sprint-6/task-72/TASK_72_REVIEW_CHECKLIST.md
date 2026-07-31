# Task 72 — Review Checklist

## Profile and policy

- [x] One typed reusable production profile.
- [x] Explicit 19-landmark subset and 20 connections.
- [x] Named visibility/presence/high-confidence thresholds.
- [x] High, medium, low and invalid-coordinate behavior tested.
- [x] Left/right/center treatment differs by shape/dash as well as color.
- [x] Missing/stale pose clears safely.

## Consumers

- [x] Capture Live uses shared renderer/profile.
- [x] Recorded Review uses shared renderer/profile.
- [x] Viewer and Compare use shared renderer/profile through Visualization Engine.
- [x] Nearest-frame and timestamps unchanged.
- [x] No duplicate render/playback loop.
- [x] Task 67 instrumentation preserved.

## Scaling and QA

- [x] CSS sizing clamps tested for mobile/desktop.
- [x] DPR applies once.
- [x] Mirror and cover projection tested.
- [x] Resize backing-size synchronization tested.
- [x] Browser QA completed at 320, 375, 768, 1024 and 1440px.
- [x] Contrast checked on split light/dark background.

## Compatibility

- [x] Raw Pose/pose.v1 unchanged.
- [x] MediaRecorder/controller/save/retry unchanged.
- [x] API/backend/schema/storage unchanged.
- [x] No dependency.
- [x] No Task 73, smoothing, angles or Worker.

## Validation

- [x] Focused renderer/profile tests.
- [x] Complete frontend suite: 43 files / 252 tests passed.
- [x] Typecheck and production build.
- [x] Lint not applicable; no frontend lint script.
- [ ] Physical camera/device performance measurements unavailable in the authenticated test environment.
