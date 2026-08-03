# Task 75 — Pose Quality Targets

## Measurement definitions

- **Jitter:** for each production benchmark landmark (shoulders, elbows, wrists, hips, knees, ankles: IDs 11–16 and 23–28), compute normalized-2D radial RMS displacement from its median position over a static sequence; report every landmark, then sequence median and P95. Exclude frames containing intended movement and report exclusions. World-3D jitter uses metres and must be reported separately; it is not mixed into the initial target.
- **Times:** camera observation is the monotonic instant a new candidate is observed; source media timestamp identifies video content; inference start/completion bracket engine work; accepted publication is after scheduler/session/stale guards; rendered-frame time is the completed overlay render when measurable. Inference latency is completion − start. Publication latency is accepted publication − camera observation. End-to-end age is render − camera observation.
- **Displayed Pose age:** latest media time − displayed Pose source media time. Fresh is `<=200 ms`, degraded is `>200–300 ms`, stale/unavailable is `>300 ms` and must clear. The canonical timeout is the existing production profile's 300 ms; renderers must not invent another.
- **Drops:** separately count observed candidates, minimum-interval skips, coalesced/replaced pending frames, stale result rejects, inference failures, accepted publications, and recorded Pose frames. Bounded intentional scheduling is not a failure. Report ratios with their named denominator.
- **Availability:** missing means no landmark entry; unavailable means missing, nonfinite, or unusable under policy; low confidence means finite visibility below 0.35; partial means at least one but not all benchmark landmarks usable; unavailable Pose frame means no usable benchmark Pose. Never substitute zero.
- **Low-confidence ratio:** numerator is present benchmark samples with finite visibility `<0.35`; denominator is all present benchmark samples. Missing/nonfinite samples are availability failures, not low confidence. Report per frame, sequence mean, and P95.
- **Continuity:** record each temporary missing run, displacement jump, nonfinite value, timestamp regression, duplicate identity, and camera-session change. Regressions/duplicates/old sessions are rejected, never reordered; jump/gating/recovery algorithms belong to Task 77.
- **Synchronization:** expected association is the nearest Pose timestamp to media time. Error is their absolute difference. Capture Review measures now; Viewer/Compare adopt the same definition later. Seek/next/previous must settle on the requested media frame before measuring.
- **Runtime:** report candidate rate, attempts/completions/failures, accepted publication rate, P50/P95 latency/age, main-thread long tasks when supported, retained-resource growth, and 30-minute stability, split by desktop/mobile and device/browser.

## Threshold classification contract

Every metric has exactly two machine-readable boundaries. For lower-is-better metrics, values `<= passBoundary` pass, values `>= failBoundary` fail, and values strictly between them warn. For higher-is-better metrics, values `>= passBoundary` pass, values `<= failBoundary` fail, and values strictly between them warn. Nonfinite values are unavailable. Lower-is-better boundaries must satisfy `passBoundary <= failBoundary`; higher-is-better boundaries must satisfy `passBoundary >= failBoundary`, otherwise the policy is invalid.

When both boundaries are equal, the pass comparison takes precedence at that exact value and there is no warning interval. This represents the confirmed stale contract precisely: a configured/displayed age of 300 ms is permitted and any value above 300 ms fails and must clear.

## Initial targets

| ID | Pass boundary / fail boundary | Unit, aggregation | Scenario | Status |
| --- | --- | --- | --- | --- |
| jitter-2d | 0.012 / 0.030 | normalized coordinate, landmark RMS then P95 | static matrix | Physical validation required |
| inference-latency | 50 / 120 | ms, P95 | motion/delay | Physical validation required |
| publication-latency | 80 / 200 | ms, P95 | arm/replacement | Physical validation required |
| pose-age | 120 / 300 | ms, P95 | motion | Physical validation required |
| stale-timeout | 300 / 300 | ms, configured boundary | delay/tab restore | **Confirmed existing contract** |
| low-confidence-ratio | 0.05 / 0.30 | ratio, frame then mean/P95 | static/low light | Physical validation required |
| unavailable-frame-ratio | 0.02 / 0.10 | ratio, sequence | flexion/occlusion | Physical validation required |
| sync-error | 34 / 100 | ms, P95 | review playback/seeks | Physical validation required |
| publication-rate | 20 / 10 | Hz, sequence (higher is better) | motion | Physical validation required |
| resource-growth | 5 / 20 | percent after 30 min | long session | Physical validation required |

Exact definitions, scenarios, evidence strings, directions, and thresholds are canonical in the frontend policy module. All device-dependent values are provisional until Task 84; no desktop, Android, or iPhone validation is claimed. Task 84 may revise numbers with evidence but not redefine meanings.
