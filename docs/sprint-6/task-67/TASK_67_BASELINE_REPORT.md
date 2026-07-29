# Task 67 Baseline Report

## Status

**Full before baseline is incomplete.** This Codex execution environment provided source, Node,
TypeScript, and test execution, but no authenticated interactive browser session, physical camera,
human subject, or representative device matrix. Consequently no camera scenario was executed and
no runtime number is claimed.

## Environment and revision

- Revision at implementation: `ec888ac`
- Workspace: Windows / PowerShell
- Instrumentation mode tested: deterministic collector instances in Vitest
- Physical-device evidence: unavailable
- Browser simulation or CPU throttling evidence: not executed

## Executed automatic evidence

| Evidence | Result |
|---|---|
| Focused instrumentation tests | 1 file passed; 7 tests passed |
| Complete frontend test suite | 35 files passed; 195 tests passed |
| Production type-check/build | Passed; 171 modules transformed |
| Production diagnostics gate | Covered by deterministic flag test; production input resolves disabled |

The instrumentation unit tests validate calculation and accounting behavior with synthetic
timestamps/landmarks. They are not Capture performance measurements.

## Scenario results

Scenarios 1–7 from `TASK_67_BASELINE_TEST_PROTOCOL.md` are **implemented but not executed**.
Inference duration, FPS, pose age, runtime jitter, long-task correlation, preview synchronization,
manual visible lag, device differences, and physical-versus-throttled comparisons are therefore
unavailable. There are no sample summaries to report.

## What remains

Run the protocol in an authenticated development browser with a physical camera, export one JSON
snapshot per scenario, then add the run headers and raw sample summaries here. At least one primary
desktop browser and one representative lower-performance physical device are required for a
complete before baseline. CPU throttling may supplement, but cannot replace, physical-device
evidence.

## Limitations

The camera rate and frame-to-overlay values are explicitly browser observation proxies, not sensor
latency. Long Tasks API support varies by browser. Development React Strict Mode can affect render
counts. Stationary jitter depends on framing, distance, lighting, clothing, and actual subject
motion; those conditions must accompany results.
