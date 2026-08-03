# Task 75 — Pose Data Policy

## Authority decision

The immutable Raw Canonical Pose is authoritative evidence. Canonical mapping converts an engine result into platform-owned landmark arrays, retains all 33 current MediaPipe Pose landmark identities, normalized 2D coordinates, world 3D coordinates when available, visibility, engine metadata, and frame/time identity. Only Raw Canonical Pose accepted during the official recording interval may enter `pose.v1` serialization.

`pose.v1` remains unchanged and authoritative. It contains no angles, Metric Series, filtered coordinates, or runtime filter metadata and must not be upgraded or reinterpreted silently.

Filtered Runtime Pose is derived, non-authoritative, reproducible, runtime-only data. It must preserve landmark and source frame/time identity, never mutate Raw arrays, and must not be uploaded or stored in PostgreSQL, object storage, Redux, Record metadata, or `pose.v1`. Task 75 defines the boundary but does not implement this type or a filter. The profile is an identity transform until Task 77.

```text
Pose Engine Result -> Canonical Mapping -> Raw Canonical Pose
  +-> official recording collection -> pose.v1
  +-> versioned formal-analysis preprocessing -> Motion Model / Metrics
  +-> Runtime Pose Quality Pipeline -> Filtered Runtime Pose -> visualization only
```

Formal analysis never consumes incidental live-display output. Any analysis preprocessing is separately approved, versioned, and reproducible.

## Consumer matrix

| Consumer | Approved input | Policy |
| --- | --- | --- |
| Live Capture Skeleton / future Angle Overlay | Filtered Runtime Pose | Identity through Task 76; visualization only |
| Countdown | Raw Canonical Pose | Readiness/control only; never collected |
| Recording / `pose.v1` serializer | Raw Canonical Pose | Only official-interval accepted frames; persistence allowed |
| Capture Review | Persisted-equivalent Raw Pose | Shared visualization-quality profile; no captured filtered artifact |
| Viewer | Persisted Raw `pose.v1` | Same shared visualization-quality boundary |
| Compare | Persisted Raw `pose.v1` per Record | Viewer policy independently per side |
| Metric Series / Summary | Raw Canonical Pose | Versioned analysis preprocessing, never live display output |
| Debug | Explicitly labelled raw/filtered comparison | Diagnostic only; not a normal product result |

The machine-readable authority and consumer contracts live in `frontend/src/engines/poseQuality/poseQualityPolicy.ts`. Changing metric meaning requires a policy/version change. Historical display-profile persistence remains out of Sprint 7 scope.
