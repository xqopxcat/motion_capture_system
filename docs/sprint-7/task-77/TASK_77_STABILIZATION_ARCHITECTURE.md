# Task 77 — Stabilization Architecture

## Runtime flow

```text
Pose adapter result -> canonical mapper -> RawCanonicalPose
  +-> official recording -> pose.v1
  +-> existing formal-analysis dataset path
  +-> RuntimePoseQualityEngine (accepted scheduler publications only)
       -> FilteredRuntimePose(runtime-visualization.stabilized.v1)
            -> transparent Live Capture skeleton overlay
```

Task 76's stateless identity implementation is replaced at the same Raw-to-Filtered boundary. `usePosePipeline` owns one engine instance. State keys combine collection (`2d`/`3d`) and validated landmark ID; every coordinate owns a separate One Euro scalar filter. State is bounded to 66 landmark collections and bounded diagnostic buffers.

Raw Pose is never mutated. Recording continues from `currentRawPose`; display consumes `currentFilteredPose`. Scheduler generation/session rejection occurs before `transform`, so skipped candidates and stale results cannot update filter state. Capture Review, Viewer, Compare, publisher, and formal analysis are unchanged.

Task 78 may consume stabilized runtime Pose only under its future Joint Angle Metric Contract; Task 77 adds no angles, registry, Metric Series, or formal-analysis preprocessing.
