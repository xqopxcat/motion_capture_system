# Task 83 Review Checklist

- [x] 現行 realtime/formal/authority/publish path 已盤點
- [x] Realtime/Final profile 是 immutable discriminated types
- [x] causal/future/persistence 矛盾會被型別或 validator 阻止
- [x] ordered、duplicate、irregular、gap、empty、single、session 規則已測
- [x] synthetic 0/90/noise/step/missing/low-confidence/two-session 已測
- [x] raw、causal、non-causal與angle-series order已比較
- [x] missing 不變 0、long gap/session 不插值、不跨 session smoothing
- [x] Raw 未修改，production Task 77/79 未修改
- [x] pose.v1、metrics.v1、Capture、Review、publisher 未修改
- [x] experiment 未被 production import，無 UI/backend/Worker
- [x] truth 限制、schema gap、Task 84 關係已記錄
- [x] 文件只有一個 overall decision
