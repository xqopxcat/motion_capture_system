# Task 83 Realtime Profile 結果

Task 77 符合 live ownership：causal、固定拓樸、One Euro jitter suppression、visibility/outlier gates、有界 hold、明示 unavailable、sourceTimestampMs、gap/session reset。實驗確認 stationary alternating jitter range 降低、短 confidence loss 維持 degraded、超過 hold 後 unavailable、recovery/session reset 不沿用舊狀態。

代價是 step/fast reversal 的 causal lag 與 movement attenuation。structured evaluator 對實驗用 alpha=0.5 causal candidate 測得 30°→150° lag 3 frames（±5°），但這不是 Task 77 參數或物理裝置 responsiveness 的量測。Realtime contract 應擁有 latency、hold、stale、2D fallback 與 degraded semantics；參數不在 Task 83 調整，待 Task 84。
