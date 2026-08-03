# Task 76 — Raw / Filtered Pose Architecture

## Before

The Pose Engine returned a mutable `PoseDetectionResult`. The MediaPipe adapter copied provider landmarks into platform-shaped objects, but Live Capture visualization and recording consumed the same accepted object. Authority was documented but not represented by types.

```text
MediaPipe result -> normalized PoseDetectionResult -> scheduler publication
  +-> Live Capture overlay
  +-> recording collection -> pose.v1
```

## After

```text
provider result -> adapter-owned PoseDetectionResult
  -> mapPoseDetectionResultToRawCanonicalPose
  -> RawCanonicalPose (authoritative, readonly, nominal)
       +-> recording collection -> dataset draft -> pose.v1
       +-> existing formal-analysis/dataset path
       +-> transformRawPoseForRuntimeVisualization
            -> FilteredRuntimePose (runtime-only, readonly, nominal)
                 -> Live Capture overlay
```

The canonical mapper validates source identity, permits an empty no-Pose result or exactly 33 current-adapter landmarks, rejects nonfinite coordinates and invalid IDs, and clones every provider landmark. The source media timestamp, accepted frame identity, camera session identity, engine name, and engine version are retained.

Task 76 initially supplied a pure identity transform. Task 77 subsequently replaced it with the stateful `runtime-visualization.stabilized.v1` engine at the same Raw-to-Filtered insertion point, without changing recording or persistence paths.

Runtime visualization filtering is not formal-analysis preprocessing. Metric Series/Summary and the existing left-knee publisher remain on the persisted Raw dataset path; Task 79 owns the calculator migration.
