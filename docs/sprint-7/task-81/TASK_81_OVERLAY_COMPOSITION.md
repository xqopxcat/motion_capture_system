# Task 81 — Overlay Composition

Each Live or Review surface has one transparent Canvas over its video. Every draw cycle performs exactly: clear; skeleton when enabled using `clear: false`; angles when enabled using `clear: false`. Both-off still clears. Angle-only does not imply Skeleton-on.

Canvas sizing is centralized through `syncProductionCanvasSize`. Skeleton and angles receive identical source viewport, contain/object-fit and mirror policy. Neither renderer draws video pixels or resizes during drawing. ResizeObserver continues to redraw Review; Live follows its existing Pose/display-frame cadence.
