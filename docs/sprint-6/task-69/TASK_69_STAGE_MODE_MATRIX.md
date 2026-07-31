# Task 69 Stage Mode Matrix

| Product State | Stage mode | Viewport | Primary action | Secondary | Notes |
|---|---|---|---|---|---|
| PermissionRequired | permission | Safe permission surface | Enable Camera when recoverable | Back policy remains controller-owned | Denial guidance names browser settings |
| RequestingPermission | permission | Requesting surface | None | None | Repeated request unavailable |
| Preparing | preparing | Live camera when stream exists; otherwise preparation surface | None | None | Pose readiness remains controller-owned |
| Ready | live | Camera + live skeleton | Record | Camera switch capability remains in presentation model | One live surface |
| Countdown | live | Same camera + skeleton with countdown overlay | Cancel | None | Countdown is not separately announced per tick |
| Recording | live | Same camera + skeleton with REC/timer | Stop, disabled after request | None | Finishing status uses Task 68 presentation |
| Reviewing | review | Recorded video + synchronized pose canvas | Save Recording | Retake | Interruption warning and title supported |
| Saving | saving | Same recorded review with progress overlay | None | None | Playback/seek/title disabled; RAF stopped |
| Completed | completed | Success surface | View Record | Capture Another deferred/optional | No media surface |
| Failed | failed | Safe failure surface | Retry only when retryable | Back policy remains controller-owned | No provider internals |

## Exclusivity rule

`getCaptureStageMode()` is exhaustive over the discriminated Product State. The Stage derives
`showsLiveSurface` and `showsReviewSurface` from mutually exclusive modes and renders them in a
single conditional viewport. No CSS hiding is used; the inactive component is unmounted.

Impossible visible combinations:

- live camera and recorded review together;
- lower-page preview plus Stage preview;
- review controls during a non-review state;
- Retry for a non-retryable failure;
- Save Recording outside Reviewing.
