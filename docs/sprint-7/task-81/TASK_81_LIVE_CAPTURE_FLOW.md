# Task 81 — Live Capture Flow

MediaPipe Raw Pose continues through Task 77 stabilization into the latest `FilteredRuntimePose`. The overlay computes only the immutable selected metrics with `calculateSelectedRuntimeJointAngles`, supplies pose-age context, and immediately draws Task 80 runtime results. No result history or persistence exists.

The same pose, source viewport, contain policy and front-camera mirror option feed skeleton and angles. A camera-session/pose replacement triggers the existing effect; absent/stale Pose clears prior pixels and the existing 300 ms timeout prevents frozen overlays. Recording remains Raw-only.
