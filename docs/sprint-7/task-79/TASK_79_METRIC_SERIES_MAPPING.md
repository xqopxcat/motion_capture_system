# Task 79 — Metric Series Mapping

Current metrics.v1 is `{ version: "1.0", series: [{ metricId, unit: "degree", values: number[] }] }`. It has no timestamp/frame-index fields and does not admit null values. Backend/upload/storage contracts accept this artifact without schema change.

The publisher therefore keeps numeric-array compatibility: only available formal values enter `values`; unavailable values never become zero; summaries use only those numeric values; no usable samples throws the existing deterministic error. This necessarily compresses unavailable-frame time alignment because the existing schema forces it. Source timestamps remain present in engine results but cannot be serialized in metrics.v1. A future versioned schema migration must solve alignment explicitly.

`pose.v1`, Raw recording, Filtered Runtime Pose persistence, upload/finalization and storage paths are unchanged. Runtime results are never persisted as formal evidence.
