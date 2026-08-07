# Task 84 Known Issues

| ID | Severity | Confirmed observation | Root cause | Status |
|---|---|---|---|---|
| T84-B1 | blocker | 初始preview/Skeleton mirror相反；一次flip後對齊 | overlay依front policy mirror，但video從未套用同一presentation mirror | fixed in code；Desktop front/rear/flip rerun required |
| T84-B2 | blocker | Angles toggle無visible arc/label | runtime calculator在preferred world-3D幾何退化時直接unavailable，未繼續已核准normalized-2D fallback | fixed in code；Desktop available/degraded/unavailable與四toggle states rerun required |
| T84-B3 | blocker | Save顯示Analysis failed | diagnostics confirmed `formal-metrics-unavailable`: Save required at least one valid left-knee result; low-confidence lower-body input therefore blocked the entire recording | fixed in code: explicit empty analysis is persistable; no zero/NaN/fabricated angle; rerun required |
| T84-B4 | blocker | Recorded Review skeleton flashes during playback | fixed ±100 ms nearest-frame window returned `null` inside sparse 134–366 ms Pose gaps and cleared Canvas | fixed in code: causal active-frame hold; Desktop rerun required |
| T84-B5 | blocker | One Desktop run observed Live Capture skeleton lag at approximately 7.4 camera/inference FPS | acquisition/inference cadence and temporal-filter contribution are not yet isolated | camera requests ideal 30 FPS; Task 77 profile remains `1.2/0.08/1`; controlled multi-run before/after evidence and versioning decision pending |

Metric policy：部分formal unavailable frames會排除且不代入0；至少一個usable sample可正常summary。完全沒有usable angle sample時以顯式空analysis保存recording/pose，不伪造數值。Malformed Pose、API/storage/lifecycle錯誤仍正確失敗。

Open evidence gaps：三個fix尚未physical rerun；其餘Desktop未判定；Android/iOS not-run；nose/philtrum alignment、arc radius、Task82/83 device evidence仍pending。
