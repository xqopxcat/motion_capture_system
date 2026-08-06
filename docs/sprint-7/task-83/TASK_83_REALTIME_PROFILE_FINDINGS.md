# Task 83 Realtime Profile 結果

Task 77 符合 live ownership：causal、固定拓樸、One Euro jitter suppression、visibility/outlier gates、有界 hold、明示 unavailable、sourceTimestampMs、gap/session reset。實驗確認 stationary alternating jitter range 降低、短 confidence loss 維持 degraded、超過 hold 後 unavailable、recovery/session reset 不沿用舊狀態。

代價是 step/fast reversal 有 causal lag與 movement attenuation；低 FPS 也會改變時間型 filter response。這是 live overlay 可接受的 responsiveness/stability tradeoff，但不能成為 formal evidence。建議 Realtime contract 擁有 latency、hold、stale、2D fallback 與 degraded semantics；參數不在 Task 83 調整，待 Task 84。
