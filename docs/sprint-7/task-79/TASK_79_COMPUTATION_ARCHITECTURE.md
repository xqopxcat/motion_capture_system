# Task 79 — Computation Architecture

`computeUnsignedInternalAngle()` is the only geometric implementation. Registry-driven orchestration resolves the A–B–C triplet, confidence threshold, coordinate policy, version and provenance before invoking it.

Runtime: `FilteredRuntimePose` → runtime selector/quality adapter → shared geometry → `RuntimeJointAngleResult`. Formal: Raw Canonical Pose or immutable persisted-frame adapter → formal selector → shared geometry → `FormalJointAngleResult`.

Public single/selected/all APIs exist separately for runtime and formal inputs; batch order follows requested or registry order and one unavailable result cannot block others. The module has no React, Canvas, Redux, API, storage or mutable frame history. Task 80 may consume runtime results; Task 81 owns Capture/Review integration.
