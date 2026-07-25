# Capture Quality Optimization Backlog

Status: **Approved follow-up; not a Sprint 5 Production MVP release blocker.**

## Why this work is required

The Production MVP can capture, preview, persist, and replay a browser-analyzed
Record. Physical-camera validation identified a separate quality pass that must
not be confused with production wiring completion.

Observed limitations:

- Pose landmarks visibly jitter during Capture.
- Capture, recorded Preview, and Record Viewer require further latency and
  timestamp synchronization validation.
- Detection and rendering smoothness varies with browser/device performance.
- Capture UI and recording feedback require a focused usability pass.
- MediaPipe Pose hand and face landmarks do not constitute complete hand or
  face tracking.

## Product boundary

The current MediaPipe Pose integration is a body-pose capability.

- The hand-related Pose landmarks (wrist, thumb, index, and pinky reference
  points) must not be presented as complete finger or finger-joint tracking.
- The limited Pose face landmarks are currently only body-pose reference
  points. No face mesh, facial-expression analysis, or defined face-analysis
  product capability is approved.
- Complete hand tracking requires a separately approved Hand Landmarker or
  equivalent integration.
- Complete face tracking requires a separately approved Face Landmarker or
  equivalent integration.
- UI labels, documentation, and release claims must preserve these boundaries.

## Follow-up workstreams

### Accuracy and stability

- Establish representative camera, lighting, distance, motion-blur, occlusion,
  and device test cases.
- Measure landmark jitter rather than tuning only by visual impression.
- Evaluate EMA, One Euro Filter, Kalman filtering, interpolation, visibility
  weighting, and implausible-displacement rejection.
- Define separate behavior for low-visibility and temporarily missing
  landmarks.
- Ensure filtering does not introduce unacceptable motion lag.

### Timing and smoothness

- Measure camera-to-overlay, recorded-video-to-pose, and seek-to-render latency.
- Verify one shared recording time origin across video and pose artifacts.
- Validate irregular pose timestamps, dropped detections, playback rates,
  pause/seek, previous/next frame, Preview, Viewer, and Compare.
- Profile detection FPS, render FPS, main-thread blocking, model warm-up, and
  device-specific degradation.

### Capture UX

- Review camera readiness, framing guidance, countdown/start/stop feedback,
  processing feedback, Preview controls, retry, and error recovery.
- Test responsive Capture UI on desktop, tablet, and mobile layouts.
- Make degraded confidence or unavailable tracking visible without obscuring
  the recorded subject.

### Hand and face decisions

- Decide whether coarse Pose hand/face points should be rendered, hidden, or
  relabeled.
- Define actual user stories and acceptance criteria before adding Hand or Face
  Landmarker models.
- Assess performance and artifact-schema impact before approving additional
  models.

## Required acceptance metrics

Before this backlog item is considered complete, the team must define and
record measurable targets for:

- median and worst-case overlay latency
- Preview and Viewer synchronization error
- effective detection and render FPS on supported device tiers
- landmark jitter while the subject holds a static pose
- recovery behavior after occlusion or confidence loss
- maximum acceptable latency introduced by smoothing
- Capture task completion and error-recovery usability

Exact thresholds remain a product/engineering decision and must be locked
before implementation is accepted.

## Release interpretation

Sprint 5 proves the real production data path. It does not certify
professional-grade biomechanical accuracy, complete finger tracking, face
analysis, or final Capture UX quality. This follow-up should receive dedicated
scope and validation rather than being folded into unrelated wiring tasks.
