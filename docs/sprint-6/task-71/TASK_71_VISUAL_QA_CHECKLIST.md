# Task 71 — Visual QA Checklist

## Automated browser QA

- [x] 320px: no horizontal overflow; actions and title remain usable.
- [x] 375px: Permission, Ready, Countdown, Recording, Reviewing, Saving, Completed and Failed have no horizontal overflow.
- [x] 768px: Ready stage is readable and media remains 16:9.
- [x] 1024px: Saving keeps review context, overlay and truthful artifact progress.
- [x] 1440px: workspace is centered and capped at 1120px.
- [x] Live and review surfaces are mutually exclusive in every inspected state.
- [x] Saving disables Play, timeline and title.
- [x] Completed and Failed remain distinct.
- [x] 320×568 navigation dialog fits inside the viewport and retains `alertdialog`/`aria-modal` semantics.
- [x] Main action target is at least 48px; preview control target is at least 44px.

## Physically inspected rendering

- [x] Tablet Saving screenshot inspected for hierarchy, overlay readability and media alignment.
- [x] DOM geometry inspected at all required widths.
- [x] All Product State static presentations inspected through a temporary, uncommitted local QA harness.

## Not physically validated

- [ ] Real camera permission prompt and actual camera device aspect variants.
- [ ] Physical Ready → Countdown → Recording transition with MediaRecorder.
- [ ] Physical recorded file playback and pose synchronization on iOS/Android devices.
- [ ] Real network upload/retry timing and backend-driven Completed transition.
- [ ] Hardware safe-area devices (CSS `env()` handling was inspected programmatically).

The normal local `/capture` route required authentication in the available in-app browser. A temporary Vite-only QA harness rendered the production components and was deleted after validation; it is not part of the committed changes.

