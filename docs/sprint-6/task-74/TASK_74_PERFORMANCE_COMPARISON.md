# Task 74 — Performance Comparison

## Structural evidence after Task 73

| Metric/guarantee | Task 67 baseline | Task 74 evidence | Status |
| --- | --- | --- | --- |
| Active inference maximum | no physical sample | deterministic maximum `1` | Structural PASS |
| Pending capacity | not defined/measured | deterministic maximum `1` | Structural PASS |
| Latest pending replacement | unavailable | first/second/third deferred test | Structural PASS |
| Frame resource release | unavailable | replacement/completion/pause/rotate/dispose tests | Structural PASS |
| Stable image/timestamp | unavailable | canvas snapshot + video advancement test | Structural PASS |
| Candidate/coalesced/stale/publication counters | not present | deterministic collector accounting | Structural PASS |

## Runtime measurements

Task 67 explicitly recorded no authenticated camera baseline. Task 74 had the same limitation. Camera intervals, inference FPS and duration mean/P95, candidate/coalesced/replacement counts, stale rejects, source-to-publish latency, pose age, render duration, React renders, long tasks, preview sync, and static jitter therefore have no physical before/after numbers.

No performance improvement is claimed. The diagnostics schema and deterministic calculations pass; actual comparison requires exporting diagnostics JSON from the Task 67 protocol on the same browser/device/scenario before interpreting change. Camera and source-to-overlay timings remain browser proxies, not sensor latency.
