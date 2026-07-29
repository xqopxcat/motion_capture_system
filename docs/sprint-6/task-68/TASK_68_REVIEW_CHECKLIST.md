# Task 68 Review Checklist

## State and authority

- [x] One feature controller owns Product State.
- [x] State-specific context uses a discriminated union.
- [x] All approved states/events are represented.
- [x] Invalid events and stale tokens are side-effect free in the reducer.
- [x] Repeated camera, Record, Countdown, Stop, Save and Retry intents are guarded.
- [x] Hooks do not independently declare Ready/Reviewing/Saving/Completed/Failed.

## Camera, recording and review

- [x] Granted permission can auto-request; prompt/unknown requires Enable Camera.
- [x] Permission reason/guidance is explicit.
- [x] Camera/video/Pose readiness gates Ready.
- [x] Camera switching is accepted only from Ready.
- [x] Countdown is configured at 3 seconds, monotonic and cancellable.
- [x] Countdown/hidden-page samples do not enter official Raw Pose collection.
- [x] Recorder and pose collection start in one transition-owned transaction.
- [x] Stop is once-only and state remains Recording while stopping.
- [x] Named 500 ms review threshold is documented/tested.
- [x] Valid interruption carries a warning; invalid output cannot Review.
- [x] Retake is Reviewing-only and resets local review resources.

## Saving and recovery

- [x] Four Saving substates are explicit.
- [x] Analysis/artifact preparation precedes create.
- [x] Known Record ID is reused and completed artifacts are retained.
- [x] Ambiguous creation cannot silently duplicate.
- [x] Lifecycle retry and Ready-only completion remain.
- [x] Finalization transport failure reconciles Record detail where possible.
- [x] Failure state carries stage, safe message, retry policy/target and recovery resources.

## Lifecycle and compatibility

- [x] Hidden Countdown cancels; hidden Recording stops once.
- [x] Visibility restoration does not restart work.
- [x] `beforeunload` is state-controlled.
- [x] Unmount invalidates operations and runs idempotent adapter cleanup.
- [x] Task 67 diagnostics remain bounded, gated, resettable and outside reducer.
- [x] Sprint 5 tests and complete frontend suite pass.
- [x] Raw pose, all 33 landmarks and persisted enums remain unchanged.
- [x] No UI redesign, scheduling optimization, smoothing, Worker or angles.
- [x] No backend/API/schema/dependency change.
- [x] Task 69 not started.

## Pending physical integration evidence

- [ ] Permission prompt/granted/denied flows verified on representative browsers.
- [ ] Track ended/device loss and background stop verified with real MediaRecorder output.
- [ ] Camera switching verified on multi-camera mobile hardware.
- [ ] In-app router-wide link blocking integrated/verified; current coverage is presentation policy plus `beforeunload`.
- [ ] Countdown/recording start skew measured with Task 67 diagnostics on devices.
- [ ] Object URL/track cleanup checked with browser tooling.

Review conclusion: controller/state-machine implementation and automated compatibility pass; the
unchecked items require interactive physical-browser validation and do not authorize Task 69.

