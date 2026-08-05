# Task 81 — Integration Architecture

Capture route-local state owns independent Skeleton/Angles preferences. Live `CaptureSkeletonOverlay` owns one transparent Canvas and derives selected Task 79 runtime results from its current `FilteredRuntimePose`. Review `RecordedPosePreview` resolves one recorded Raw frame and derives Task 79 formal results locally.

Both paths clear once, optionally render the skeleton, then render angles with `clear: false`. Task 80 exposes separate runtime and formal entry points over shared projection/layout/drawing internals; provenance types remain intact. No second Canvas, camera, inference loop or persistent store was added.
