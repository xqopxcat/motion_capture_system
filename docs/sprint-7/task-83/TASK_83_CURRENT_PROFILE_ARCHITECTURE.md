# Task 83 現行 Profile 架構

Realtime：RawCanonicalPose → Task 77 `runtime-visualization.stabilized.v1`（One Euro、visibility gate、velocity outlier gate、最多 120 ms／3 samples hold、33-slot quality metadata）→ FilteredRuntimePose → Task 79 runtime angles（world-3D 優先、normalized-2D fallback；available/degraded/unavailable）→ Task 80/81 Canvas。

Formal／Review／publish：錄製的 Raw pose.v1 frame → Task 79 `joint-angle-analysis.v1@1.0.0` frame-local world-3D calculation（available/unavailable）→ Review one-frame cache 或 metrics.v1 knee series／summary。Raw 是權威資料；runtime filtered 不持久化。

目前沒有真正的 sequence-level final temporal preprocessing profile。formal provenance 記錄 angle analysis profile，但 metrics.v1 沒有完整 preprocessing profile/version/coverage provenance，因此跨 profile summary 不應直接比較。
