# Task 76 — Type Contract

## Contracts

`PoseDetectionResult` is the mutable Pose Engine adapter result. It is not authoritative Raw evidence.

`RawCanonicalPose` is a readonly, nominally branded platform contract containing engine identity, source `timestampMs`, optional accepted `frameIndex`, optional `cameraSessionId`, readonly normalized 2D landmarks, and readonly world 3D landmarks. The brand is compile-time only and constructed solely by the canonical mapper; it adds no persisted field.

`FilteredRuntimePose` is a different readonly nominal type. It preserves the Raw identity and coordinate shapes, adds only `runtimeProfileId: "runtime-visualization.identity.v1"`, and is constructed solely by the runtime quality boundary.

Both factories clone arrays and landmark objects. The two deliberate brand assertions are confined to those factories because TypeScript unique-symbol brands have no runtime payload. Consumer code uses no authority cast.

## Allowed consumers

| Type | Allowed |
| --- | --- |
| Adapter result | Canonical mapper only |
| Raw Canonical Pose | scheduler publication/instrumentation, official recording collector, future approved formal-analysis input, runtime quality boundary |
| Filtered Runtime Pose | Live Capture runtime visualization and diagnostics |

Filtered cannot satisfy `RawPoseCollector`, `CaptureSkeletonOverlay` requires Filtered, and Filtered cannot satisfy the dataset serializer or current metric publisher parameter types. No Filtered-to-Raw conversion exists.

Runtime profile identity is distinct from formal analysis profile/version semantics. Neither type contains angles, Metric Series, UI state, persistence instructions, or provider-owned arrays.
