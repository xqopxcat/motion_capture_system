# Task 83 實驗設計

純 Vitest/Node harness 接收 ordered RawCanonicalPose，fail-fast 拒絕同 session 的 duplicate/out-of-order frame 或 timestamp。session 邊界重設 causal state，non-causal window 不跨 session。

合成左膝 world-3D 提供精確 0°、90°、平滑／step 角度、88/92 交替 noise、缺少 world-3D、低 confidence、長短缺失及兩個 sessions。候選為 raw frame-local、alpha=0.5 causal coordinate EMA、radius=1 centered coordinate average，另將 angle-series centered average 分開比較；不插值 missing frame。

輸出 count、valid/unavailable/degraded、MAE/max error、jitter standard deviation、transition lag 欄位，以及 preprocessing/metric/total monotonic duration。CI 不設 wall-clock threshold；重跑以 deep equality 驗證 deterministic samples。Raw 以序列化前後相等證明未改動。
