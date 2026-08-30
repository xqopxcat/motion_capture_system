# 2026-08-31 — Navigation and Compare implementation notes

## Scope

This note records the product changes made during the 2026-08-31 review session. It describes the current implementation, not final visual-design acceptance. Capture, Records, Viewer, Compare, Dashboard and Authentication layouts will be reviewed separately before a shared style system is finalized.

## Application navigation

- Added a responsive application Sidebar so primary routes can be opened without manually entering URLs.
- The navigation exposes Capture, Records, Compare, Dashboard and Authentication destinations.
- Desktop uses persistent navigation; smaller viewports use the responsive navigation treatment.
- Route ownership and existing page behavior were not moved into the Sidebar.

Implementation baseline: `fea766cd7f8a4b0cdaa55e1e367b7e225fc58854`.

## Compare workspace

### Record selection and page structure

- The page keeps Left and Right Record selection explicit.
- Available Records remain selectable without leaving Compare.
- Once both Records are available, Compare presents two side-by-side viewers, shared playback controls, manual Right offset controls and a full-width Basic metric difference section.
- Metrics remain full-width below the viewers so the table does not require horizontal scrolling merely because it was placed in a narrow side column.
- The present layout is functional and remains subject to the later page-layout review.

### Video and Canvas composition

- Each viewer composes the recording video underneath a transparent skeleton Canvas.
- The Canvas no longer supplies an opaque background that hides the `<video>` element.
- The overlay does not intercept pointer input.
- The shared production skeleton renderer, landmark projection and skeleton connection definitions were not changed by this work.

### Playback and synchronization

- The Left recording is the authoritative shared playback clock.
- Each skeleton resolves its frame independently from that Record's Pose timestamps; the implementation no longer assumes that both Pose datasets have identical frame indices or cadence.
- Manual Sync Offset is applied to the resolved Right Pose frame.
- The Right video is the follower. During playback it is corrected only when its drift from the requested Right time exceeds the bounded tolerance.
- Repeated render ticks continue to redraw as required without changing the persisted Pose or Metric artifacts.
- The current Compare skeleton behavior was visually reviewed and considered acceptable for continued page review. This is not a physical-device performance claim.

Current implementation: `56628c5fa96ef887d61c516b933fa5a55fe886c0`.

### Metrics

- Compare continues to read the persisted Metric Series supplied by each Record.
- The attempted fallback that recomputed missing Compare metrics from Pose data was reverted. Compare must not silently replace persisted analysis artifacts with a second calculation path.
- Existing populated metrics therefore remain available, including elbow and wrist values in the reviewed Records.
- Metric identifiers have human-readable labels where the registry provides them, and degree values use the `°` presentation.
- `Missing` still means that the selected Record's persisted Metric Series does not contain a comparable value for that metric. Resolving missing knee, hip, ankle or shoulder series requires an explicit analysis/publication contract rather than a Compare-only UI fallback.

## Verification completed during implementation

- Focused Compare record-selection, metric-difference, playback-controller and VideoPlayer tests were added or updated.
- The complete frontend suite passed at 64 test files / 408 tests.
- TypeScript and the production build passed.
- These automated checks cover state and mapping behavior; they do not replace browser/device visual review for letterboxing, decoder seeking or perceived synchronization.

## Deferred review

- Review the layout of Capture, Records, Viewer, Compare, Dashboard and Authentication pages individually.
- Discuss and define the shared visual style only after the page layouts are understood.
- Revisit Compare metric publication at the analysis pipeline boundary so expected joint metrics are produced and persisted consistently.
- Continue visual synchronization checks with recordings that have different video aspect ratios and irregular Pose cadence.
