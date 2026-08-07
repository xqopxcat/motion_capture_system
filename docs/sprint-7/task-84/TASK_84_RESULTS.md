# Task 84 Results

Manual physical validation has started. No required environment has completed the full protocol.

## Desktop Chrome partial run

Exact device model、OS/browser version、camera、viewport與run date尚未提供；測試build為Phase A baseline `8efdf8a7602319a2bc802d8364cb55db4431b016`。只記錄使用者實際回報的三個scenarios：

| Finding | Actual result | Observation | Remediation status |
|---|---|---|---|
| Initial front presentation | blocker | 初始camera preview與Skeleton水平相反；按一次Flip Camera後才對齊 | code fix committed in this remediation；Desktop rerun pending |
| Live Angles toggle | blocker | toggle存在但沒有任何arc或label | world-3D degenerate geometry現在依realtime policy fallback至normalized-2D；composition/diagnostics tests added；Desktop rerun pending |
| Save Record | blocker | diagnostics: `formal-metrics-unavailable`; all selected formal knee samples unavailable | recording/pose now remain persistable with explicit empty metrics summary; Desktop rerun pending |
| Recorded Review playback | blocker | skeleton repeatedly flashes at sparse recorded Pose cadence | resolver now holds the active recorded Pose until the next frame instead of clearing outside ±100 ms; Desktop rerun pending |
| Live Capture responsiveness | blocker | one Desktop run observed visible lag at approximately 7.4 camera/inference FPS | request ideal 30 FPS; retain accepted Task 77 `1.2/0.08/1`; rerun must isolate cadence from filter lag and provide controlled before/after jitter and stale/unavailable evidence |

沒有將其他Desktop scenarios標為pass或fail。Android Chrome與iOS Safari仍為not-run。自動測試不是physical-device PASS。
