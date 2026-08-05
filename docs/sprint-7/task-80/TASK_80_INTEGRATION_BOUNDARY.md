# Task 80 — Integration Boundary

World-3D or normalized-2D Task 79 runtime values may be displayed, but their visual A–B–C always comes from the same frame/session's normalized 2D `FilteredRuntimePose`. Missing 2D display slots suppress rendering; the renderer never recalculates a 2D value.

Recommended Task 81 composition is: clear transparent overlay, render skeleton, render angles with `clear: false`. Task 80 exposes that boundary only. It does not run computation in `usePosePipeline`, add React state, wire Capture/Review, add an Angle toggle, or change controls/persistence.
