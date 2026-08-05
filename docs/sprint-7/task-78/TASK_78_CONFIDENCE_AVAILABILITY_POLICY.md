# Task 78 — Confidence and Availability Policy

Metric confidence is the minimum confidence of A, B, and C, with threshold 0.35. Availability is independent of numeric value.

| Status | Value | Meaning |
| --- | --- | --- |
| `available` | finite degrees, including 0 | all inputs satisfy the selected policy |
| `degraded` | finite degrees | runtime used held/outlier-rejected or otherwise explicitly degraded inputs |
| `unavailable` | `null` | no compliant result |

Reason codes cover `missing-landmark`, `low-confidence`, `unavailable-runtime-landmark`, `held-runtime-landmark`, `outlier-rejected-runtime-landmark`, `zero-length-vector`, `nonfinite-coordinate`, `unsupported-coordinate-space`, `malformed-topology`, and runtime `stale-pose`.

Runtime `filtered` is usable; `held` and `outlier-rejected` are degraded and retain their approved source-timestamp semantics; `unavailable` is unavailable. Formal analysis never inherits runtime hold/outlier semantics. The renderer consumes status/reason and does not invent confidence policy.
