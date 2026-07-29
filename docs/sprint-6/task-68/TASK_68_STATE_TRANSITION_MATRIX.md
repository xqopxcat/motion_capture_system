# Task 68 State Transition Matrix

All token-bearing facts require exact kind/id equality. A failed guard returns the identical state
and issues no command.

| State | Valid event / guard | Next state | Controller command / preserved or released context |
|---|---|---|---|
| PermissionRequired | ENABLE_CAMERA; recoverable/no request | RequestingPermission | Start one camera request; preserve requested device |
| RequestingPermission | CAMERA_GRANTED; active token | Preparing | Attach current stream; begin video/Pose preparation |
| RequestingPermission | CAMERA_REJECTED; active token | PermissionRequired | Stop stale candidate; retain explicit reason/guidance |
| Preparing | PREPARATION_READY; active token and stream/video/Pose ready | Ready | Start/retain live pose; preserve camera session |
| Preparing | PREPARATION_FAILED; active token | Failed | Release unusable runtime unless recovery needs it |
| Ready | RECORD | Countdown | Create 3 s configured monotonic deadline; retain stream/live pose |
| Ready | CAMERA_SWITCH | RequestingPermission | Acquire requested exact device under new token |
| Countdown | CANCEL_COUNTDOWN | Ready | Cancel timer; official pose collection never started |
| Countdown | COUNTDOWN_FINISHED; active token | Recording | Establish logical origin; start recorder and raw collection once |
| Countdown | PAGE_HIDDEN | Ready | Cancel timer |
| Recording | STOP; not already requested | Recording | Mark stop first; stop recorder and collection once |
| Recording | PAGE_HIDDEN / TRACK_ENDED; not stopping | Recording | Same safe stop, with interruption reason |
| Recording | RECORDING_READY; active token and valid snapshot | Reviewing | Stop live detection/tracks; preserve immutable video/raw pose |
| Recording | RECORDING_FAILED; active token | Failed | Release invalid local/runtime resources |
| Reviewing | RETAKE; no Saving begun | Preparing | Revoke local review output, clear title/progress, reacquire |
| Reviewing | SAVE | Saving/Analyzing | Freeze snapshot and create fresh resume context |
| Saving | SAVE_STAGE_CHANGED; active token | Saving | Update only approved internal substate |
| Saving | SAVE_SUCCEEDED; active token and backend Ready | Completed | Retain recordId |
| Saving | SAVE_FAILED; active token | Failed | Preserve snapshot, recordId and completed artifacts as required |
| Failed | RETRY; approved Saving target | Saving target substate | Reuse immutable snapshot/resume; new token |
| Failed | RETRY; permission/preparation target | PermissionRequired | Require deliberate camera recovery |
| Completed | presentation View Record | route navigation | Navigate using required recordId |
| Any active | UNMOUNT | no further product transition | Invalidate tokens and idempotently release browser resources |

`PAGE_VISIBLE` revalidates through current adapters but never restarts Countdown or Recording.
`ROUTE_LEAVE_REQUESTED` is represented for controller/router adapters; route protection is derived
from state. All other events are invalid for the current state.

## Failure recovery targets

| Failure | Retry target | Preserved |
|---|---|---|
| Permission/device | PermissionRequired | reason/guidance only |
| Preparation/recording | deliberate camera preparation | no invalid recording |
| Analysis before create | Saving/Analyzing | review snapshot; no Record |
| Known Record upload | Saving/UploadingArtifacts | recordId and completed artifact set |
| Retryable lifecycle/finalization | Saving/Finalizing | recordId, artifacts, lifecycle intent |
| Ambiguous create | none | warning context; no automatic duplicate |
| Non-retryable | none | server truth and safe navigation context |

## Impossible combinations

- Ready/Countdown/Recording without a camera session identity.
- Countdown without deadline/duration/token.
- Recording without logical origin/token or with optional review data.
- Reviewing without non-empty validated video and Raw Pose snapshot.
- Saving without snapshot, substate, resume and active token.
- Completed without backend-Ready recordId.
- Permission reason on unrelated states.
- Saving progress or completed artifacts in per-frame Redux/reducer events.
- Frontend Product State represented as persisted Record status.

