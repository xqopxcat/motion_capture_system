# Task 79 — Formal Analysis Policy

Formal APIs accept Raw Canonical Pose or an immutable persisted `pose.v1`-compatible frame adapter. The initial registry requires complete world 3D; normalized 2D is never a silent formal fallback. Slot IDs, finite coordinates and minimum A/B/C visibility are enforced without mutating input.

Results use provenance `formal-analysis`, profile `joint-angle-analysis.v1` version `1.0.0`, and preserve timestamp/frame/session where available. They contain no runtime profile or Task 77 held/outlier semantics. This minimum reproducible profile does not perform Task 83 architecture evaluation.
