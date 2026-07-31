# Task 70 — Review, Save & Recovery Specification

## Outcome

Task 70 completes the product flow `Recording → Reviewing → Saving → Completed`, with `Failed → Retry/Recovery` remaining under the Task 68 controller. The Task 69 Unified Capture Stage remains controlled and presentation-only.

## Previous flow

Task 69 unified live and recorded media, but Review exposed only a title field, Save and Retake. Duration and product-ready progress were absent, Completed had no saved title, and Failed could inherit a raw publisher error message. The title draft was also read by the asynchronous save effect instead of being frozen at the Save transition.

## Review

- Recorded video and synchronized pose overlay remain in `RecordedPosePreview`.
- Native Play/Pause and seek remain available only while Reviewing.
- Duration, interruption warning, controlled title, Retake and Save Recording are shown.
- Save trims and freezes the effective title in the immutable review snapshot.
- Retake is emitted as a controller intent. The existing recorder reset owns object URL revocation and playback unmount stops synchronization loops.

## Saving presentation

| Product substate | User-facing label | Progress |
|---|---|---|
| Analyzing | Preparing your motion analysis | Indeterminate |
| CreatingRecord | Creating your record | Indeterminate |
| UploadingArtifacts | Saving video and analysis data | Completed artifact count and current friendly artifact name |
| Finalizing | Finalizing your record | Completed artifact count; no invented percentage |

Title editing, Retake, Save and review playback are disabled during Saving. The recorded frame remains as visual context. `beforeunload` confirmation remains active through Task 68 route-leave protection.

## Completed

Completed is entered only after the publisher receives or reconciles backend `Ready`. It contains the authoritative `recordId` and frozen saved title. The Stage shows success and emits View Record; `CapturePage` owns navigation.

## Failed

The controller maps failure stage and resume state to a safe title, message, retryability, recovery label and known-Record context. The Stage does not inspect exceptions. Provider messages, HTTP bodies, storage paths, signed URLs and bucket details are not rendered.

## Minimal Task 68 defect corrections

1. Freeze the edited title in the `SAVE` transition so asynchronous saving cannot observe a later draft.
2. Carry the frozen title into Completed so success UI is truthful.
3. Classify failures using the last Saving substate and curated messages instead of raw exceptions.

These changes extend state data but do not redesign the Product State graph.

## Navigation and recovery limits

Browser refresh/unload retains the feasible native warning while protection is active. This is not guaranteed browser recovery.

Internal navigation is protected with React Router's supported `useBlocker` API. The blocker is driven by the controller-derived `routeLeaveRequiresConfirmation` flag and therefore does not reconstruct Product State. It covers Link/NavLink, programmatic navigation, and browser Back/Forward (`POP`). Stay resets the pending transition; Leave proceeds to the router's original pending destination.

Reviewing uses “Discard this recording?” and Saving uses “Leave while saving?”. Completed and states whose controller flag is false do not block.

The package range remains `react-router-dom ^7.1.1`; the installed version verified for this implementation is 7.18.0. No dependency was added.
