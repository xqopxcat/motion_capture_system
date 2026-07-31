# Task 71 — Responsive Capture Product UI Specification

## Product workspace

Capture remains one centered workspace with a maximum width of 1120px. Its hierarchy is always stage header/state label → media viewport → review/result details → actions. Permission, preparation, live capture, review, saving, completed and failed surfaces occupy the same primary workspace; no separate camera/preview panels are introduced.

## Media

- Live, placeholder and state surfaces retain a 16:9 viewport.
- Recorded media retains its own 16:9 surface; playback controls flow below it instead of compressing the video.
- Live video/canvas and recorded video/canvas share the same bounds.
- Recorded video uses `object-fit: contain` to avoid cropping.
- Countdown, REC/timer and Saving overlays remain scoped to the media surface.

## Details and actions

Review duration/title/warning, Completed success, Failed recovery and status text share a stable detail region. Long content uses safe wrapping. Primary and secondary buttons have consistent 48px product sizing; recorded preview controls retain a minimum 44px touch target. On mobile, capture actions stack without flex growth.

## Accessibility

- Semantic labels/buttons and live-region behavior are preserved.
- State badge text supplements color.
- All interactive Capture controls have visible `:focus-visible` treatment.
- Disabled Saving controls retain native disabled semantics and a visible disabled surface.
- Preparation animation honors `prefers-reduced-motion`.
- Navigation confirmation remains an accessible `alertdialog`, fits the dynamic viewport and respects safe-area insets.

## Boundaries

This task changes presentational markup and CSS only. Task 68 Product State, all transitions/actions, publisher/recovery, navigation blocking, instrumentation, MediaRecorder, Pose and API/backend/storage contracts are unchanged.

