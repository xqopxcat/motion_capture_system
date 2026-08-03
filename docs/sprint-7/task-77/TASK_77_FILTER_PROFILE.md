# Task 77 — Filter Profile

Profile: `runtime-visualization.stabilized.v1`; algorithm: `one-euro.v1`.

For elapsed seconds `dt`, low-pass `alpha = 1 / (1 + (1 / (2π cutoff)) / dt)`. The derivative is filtered at 1 Hz. Adaptive coordinate cutoff is `1.2 Hz + 0.08 × |filtered derivative|`. Source media timestamps supply irregular `dt`; timestamp/frame/session identity is never filtered.

| Parameter | Value |
| --- | ---: |
| Minimum visibility | 0.35 (shared Task 75 policy) |
| 2D maximum velocity | 8 normalized units/s |
| World 3D maximum velocity | 12 m/s |
| Consecutive outlier tolerance | 2 rejected samples before sustained movement is accepted/reset |
| Missing/low-confidence hold | 120 ms and at most 3 samples |
| Maximum time gap | 250 ms |
| Collections filtered | normalized 2D and world 3D, with independent state |

One Euro was selected for adaptive stationary smoothing, increased fast-motion response, low cost, and irregular timestamp support. Fixed EMA/low-pass cannot adapt the jitter/lag tradeoff; Kalman requires a motion/noise model and more tuning/state than justified here. Known limitations: velocity thresholds are initial engineering settings, held landmarks can appear briefly stationary, and multi-person/teleport-like motion is unsupported. Task 84 must validate tuning physically.
