# Task 78 — Legacy Left-knee Audit

Current path: `publishCaptureRecord()` → `buildKneeMetricSeries()` → private `jointAngle()` in `frontend/src/features/capture/publishCaptureRecord.ts`.

| Concern | Current implementation | Target contract / Task 79 requirement |
| --- | --- | --- |
| Identity | `knee_flexion`, `knee-flexion.v1` | `joint-angle.left-knee.internal.v1`, `joint-angle-contract.v1` |
| Inputs | persisted Raw `pose.v1` frame `landmarks2D`; 23–25–27 | same triplet, world 3D preferred/formal-required |
| Formula | 2D BA/BC dot product, clamped `acos`, degrees | same unsigned internal geometric meaning via approved calculator |
| Interpretation | named flexion but emits internal angle | must not claim anatomical flexion without explicit conversion/version |
| Confidence | ignores visibility/presence | enforce registry minimum across all three landmarks |
| Missing/invalid | missing or zero/nonfinite denominator returns `null` | typed unavailable reason and `valueDegrees: null` |
| Series behavior | removes null samples; throws if none; timestamps are not retained in series values | preserve time alignment/unavailable samples under approved Metric Series mapping |
| Boundary | calculation lives inside Capture publisher | migrate to Motion Model calculator in Task 79 |

Current publisher behavior is intentionally unchanged in Task 78. Task 79 must implement the approved calculator, migrate the publisher, explicitly handle the identity/semantic change, preserve timestamps and provenance, and add regression evidence.

Task 79 follow-up: the publisher migration is now complete. The private normalized-2D formula was removed; formal world-3D calculation now resolves `joint-angle.left-knee.internal.v1` through the shared Motion Model engine. See `docs/sprint-7/task-79/TASK_79_LEFT_KNEE_MIGRATION.md` for compatibility details.

Existing `metrics.v1` stores `metricId`, unit and numeric values, while summary metadata carries metric definition version and aggregate values. The future mapping must retain metric ID, timestamps/null samples, degrees, source/profile version, and versioned summary computation. No `metrics.v1`, backend, storage, or `pose.v1` change is made here.

Current Review/record-detail surfaces consume persisted summary/artifact metadata; Viewer initializes a generic metric display collection; Compare parses persisted series by arbitrary string `metricId` and frame index. None currently resolves this Task 78 registry. Registry-aware Capture Review, Viewer, and Compare behavior is therefore not implied by this contract: Capture/Review runtime integration belongs to Task 81, while Viewer/Compare registry integration remains a future Sprint.
