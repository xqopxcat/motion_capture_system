# Task 80 — Renderer Architecture

Input is a `FilteredRuntimePose`, readonly `RuntimeJointAngleResult[]`, selected registry metric IDs, Canvas, and projection/profile options. `prepareRuntimeAngleOverlay()` validates identity and display landmarks, reuses the production skeleton projection, prepares immutable arc/label models and bounded diagnostics. `renderRuntimeAngleOverlay()` only draws that model.

Numeric values always come from Task 79; Task 80 uses registry A–B–C and normalized 2D Pose slots only for visual placement. Public APIs are `prepareRuntimeAngleOverlay`, `renderRuntimeAngleOverlay`, `getRuntimeAngleOverlayDisplayScale`, `formatRuntimeAngleLabel`, and `RUNTIME_ANGLE_OVERLAY_PROFILE`. Formal results are excluded at the type boundary.
