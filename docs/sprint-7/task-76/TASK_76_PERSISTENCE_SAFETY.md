# Task 76 — Persistence Safety

Recording collection is Raw-only by function signature: `RawPoseCollector` accepts `RawCanonicalPose | null`. The controller calls it only while product state is `Recording`; readiness and Countdown results are excluded exactly as before. It copies Raw landmarks into `CapturePoseFrame`, after which the existing dataset draft and `buildPoseDatasetV1` path remains unchanged.

Compile-time checks prove `FilteredRuntimePose` does not match `RawPoseCollector`, the dataset serializer input, or current metric publisher input. There is no conversion from Filtered back to Raw. The overlay separately requires Filtered.

The `pose.v1` schema, exact 33-landmark validation, visibility/world-coordinate handling, timestamps, frame indexing, backend endpoints, API payloads, Record metadata, Redux, PostgreSQL, object-storage paths, and artifact list are unchanged. Runtime profile identity exists only on `FilteredRuntimePose`; unique-symbol brands are compile-time-only and cannot serialize. No filtered artifact or persistence instruction exists.

Task 76 does not claim that TypeScript can prevent a deliberate unsafe cast. It prevents ordinary structural substitution and confines the only nominal construction assertions to the two trusted factories.
