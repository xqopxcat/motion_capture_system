# Task 78 — Runtime / Formal Boundary

Runtime results have provenance `runtime-display`, consume `FilteredRuntimePose`, include `runtimeProfileId`, may use explicit normalized-2D fallback, and are non-authoritative. Displaying a result does not authorize persistence as Metric Series evidence.

Formal results have provenance `formal-analysis`, consume Raw Canonical Pose or persisted Raw `pose.v1` through an approved versioned analysis profile, include analysis profile ID/version, require world 3D in the initial registry, and are reproducible. They cannot consume incidental live filtered coordinates.

The discriminated result types prevent runtime results from structurally masquerading as formal evidence. Shared fields include metric/contract identity, nullable value, status/reason, actual coordinate space, source timestamp, optional frame/session identity, triplet, and confidence. They contain no Canvas, React, upload, persistence, or filter-internal fields.

Task 79 owns calculation and Metric Series migration. Task 83 owns evaluation of separate realtime/final production profiles. Viewer and Compare integration remains a future Sprint.
