# Task 74 — Regression Report

| Validation | Result |
| --- | --- |
| Complete frontend suite | PASS — 49 files, 271 tests |
| Focused Task 73 identity/ownership | PASS — 2 files, 6 tests |
| TypeScript project build | PASS |
| Vite production build | PASS — 184 modules |
| Lint | Not Available — no lint script |
| Git diff check | clean |

The complete suite covers Capture, routes/Auth intent, Dashboard, Viewer/Compare helpers and rendering, record lifecycle/publisher, annotation, visualization, metrics, storage-facing API logic, navigation guard, diagnostics, schema, scheduler, monotonic MediaPipe runtime timestamps and one-frame Viewer seeking.

Vite reports the existing >500 kB chunk advisory. It is not a Sprint 6 functional blocker and was not expanded into unrelated code-splitting work.

Raw Pose validation accepts exactly 33 landmarks per frame, rejects incorrect counts and invalid/nonfinite/backward data, and produces the unchanged `pose.v1`-compatible dataset. Display filtering and the bounded inference-matched Live display snapshot do not mutate stored pose.
