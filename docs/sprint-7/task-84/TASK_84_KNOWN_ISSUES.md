# Task 84 Known Issues

| ID | Severity | Confirmed observation | Root cause | Status |
|---|---|---|---|---|
| T84-B1 | blocker | 初始preview/Skeleton mirror相反；一次flip後對齊 | overlay依front policy mirror，但video從未套用同一presentation mirror | fixed in code；Desktop front/rear/flip rerun required |
| T84-B2 | blocker | Angles toggle無visible arc/label | runtime calculator在preferred world-3D幾何退化時直接unavailable，未繼續已核准normalized-2D fallback | fixed in code；Desktop available/degraded/unavailable與四toggle states rerun required |
| T84-B3 | blocker | Save顯示Analysis failed | thumbnail preparation在設定`src/currentTime`後才等待事件，可漏接already-fired loadeddata/seeked並timeout；preparation failure以前也沒有可辨識dev code | fixed in code；同一local recording/retry/save flow rerun required |

Metric policy：部分formal unavailable frames本來就排除且不代入0；至少一個usable sample可正常summary。完全沒有usable Pose仍是正確、可重試的analysis failure。Malformed Pose、API/storage/lifecycle錯誤仍正確失敗。

Open evidence gaps：三個fix尚未physical rerun；其餘Desktop未判定；Android/iOS not-run；nose/philtrum alignment、arc radius、Task82/83 device evidence仍pending。
