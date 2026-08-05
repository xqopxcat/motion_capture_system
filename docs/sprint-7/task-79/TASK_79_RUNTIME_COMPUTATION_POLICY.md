# Task 79 — Runtime Computation Policy

Runtime APIs consume the fixed nullable `FilteredRuntimePose` topology. They validate slot/ID and aligned quality metadata, prefer complete usable world 3D, then use complete normalized 2D only where registry fallback permits. A result never mixes spaces.

`filtered` is available; `held` and `outlier-rejected` are degraded, with held taking deterministic degraded-reason priority. Null/unavailable slots, malformed topology, nonfinite coordinates and low confidence are unavailable. Confidence is minimum A/B/C visibility. Failure priority is malformed topology; missing/unavailable; nonfinite; low confidence; unsupported space; zero vector.

The result source timestamp is the oldest A/B/C quality `sourceTimestampMs`, conservatively exposing held data age. Frame/session/runtime profile are preserved. Caller-provided age above the default 300 ms maximum yields `stale-pose`. Results are non-authoritative `runtime-display` data and are not persisted.
