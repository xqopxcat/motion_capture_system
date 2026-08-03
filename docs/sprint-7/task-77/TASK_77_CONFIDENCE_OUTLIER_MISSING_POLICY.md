# Task 77 — Confidence, Outlier, and Missing Policy

An expected ID with finite coordinates and absent visibility or visibility `>=0.35` is usable. Lower/nonfinite visibility, missing identity, or unusable input is unavailable; no value is replaced with zero.

For each collection/landmark, velocity is Euclidean displacement from the last accepted raw sample divided by elapsed source seconds. Units are normalized-coordinate/s for 2D and m/s for world 3D. A velocity above the profile threshold is rejected and the previous output is returned with `outlier-rejected`; rejected input does not update scalar filters. If movement remains beyond the gate, it is accepted deterministically after the bounded consecutive-outlier allowance so legitimate fast movement cannot freeze forever.

Low-confidence/missing input returns the previous stabilized landmark only while both the 120 ms and three-sample limits hold. Metadata state is `held` and retains the last accepted source timestamp, so holding cannot refresh Pose age. After either limit, state is deleted and output is `unavailable`; the landmark is omitted. Recovery initializes cleanly from the next usable sample. States exposed to renderer/diagnostics are `filtered`, `held`, `outlier-rejected`, and `unavailable`. They are runtime-only and never enter `pose.v1`.
