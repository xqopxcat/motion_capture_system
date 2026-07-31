# Task 72 — Production Display Skeleton Profile Specification

## Profile identity

`PRODUCTION_SKELETON_PROFILE` is the stable `production-display.v1` singleton under the Visualization Engine. Capture Live, Recorded Review, Viewer and Compare consume the same profile through one shared renderer.

## Display-only contract

The profile filters drawing only. Raw Pose remains 33 landmarks, and persisted `pose.v1` remains unchanged. No confidence, coordinate, frame or timestamp is mutated.

## Confidence

- High confidence: visibility and available presence ≥ 0.65; opacity 0.96.
- Medium confidence: both ≥ 0.35 but either < 0.65; opacity 0.52.
- Low confidence: visibility or available presence < 0.35; hidden.
- Missing visibility/presence: treated as available for display compatibility; stored values are never synthesized.
- Invalid non-finite coordinates or coordinates outside `[-0.2, 1.2]`: hidden.
- Connections render only when both endpoints are renderable and use the lower endpoint opacity.

The current Pose Engine and pose.v1 schema expose visibility but not presence. The renderer accepts optional runtime `presence` and applies the named threshold when it becomes available without changing the schema.

## Missing and stale pose

Missing pose clears the canvas. Capture Live schedules a single stale-clear timeout per received result and clears after 300ms without a replacement frame. A new result cancels the prior timeout and renders normally. This is bounded latest-frame display, not smoothing and not a new animation loop.

## Appearance

- Left: teal, solid connections, circular joints.
- Right: amber, dashed connections, square joints.
- Center: white solid connections/rings with a restrained dark contrast outline.
- Line caps and joins are round; no glow is used.

Shape and dash differences ensure side identity does not rely only on color.

## Scaling and alignment

Radius and width scale from CSS viewport width relative to 720px and clamp to bounded CSS sizes. They are multiplied by backing-store DPR once. Canvas backing dimensions synchronize to displayed CSS dimensions × DPR before rendering. Normalized coordinates project into the canvas; source aspect mismatch uses centered `object-fit: cover` geometry. Optional mirror projection uses `1 - x`.

