# Task 81 — Recorded Review Flow

The existing currentTime resolver selects the nearest authoritative recorded Raw frame with its threshold policy during play, pause, seek, timeupdate and end events. Only that frame and selected metrics are computed with `calculateSelectedFormalJointAngles`; no live Pose or inference is used.

World 3D supplies formal values while recorded normalized 2D supplies placement. `renderFormalAngleOverlay` accepts formal provenance directly and shares Task 80 internals without casting to runtime results. Missing frame/world/2D clears or skips safely. Recorded aspect ratio, 560 px maximum height, contain projection and non-mirrored recorded presentation remain unchanged.
