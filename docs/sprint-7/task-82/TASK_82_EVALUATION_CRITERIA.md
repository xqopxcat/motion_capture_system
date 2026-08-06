# Task 82 預先決策門檻

本門檻在實驗結果判讀前固定：

- Adopt：所有契約／生命週期／瀏覽器需求皆通過，且物理裝置 p95 至少降低 2 ms 主執行緒工作，或端到端延遲／有效幀率改善至少 10%；複製與往返成本必須低於移出的工作。
- Defer：技術上可行且正確，但未達效益門檻，或仍缺物理裝置及必要瀏覽器證據。
- Reject：破壞資料契約、無法可靠取消／丟棄舊結果、必要瀏覽器不支援，或成本高於效益且無合理改善路徑。

任何 CI 微基準只能證明相對工作量與回歸，不得代替 Task 84 物理裝置驗證。不得以單次、平均值或「結果為 finite」宣稱達標。

量測欄位包括 inference、Raw normalization、stabilization、angle、Canvas、callback-to-display、有效 Pose FPS、skip/coalesce/stale/session mismatch、React render、50 ms long task、記憶體、clone/transfer、Worker/model startup。正確性需涵蓋 frame/timestamp/session、Raw 完整性、33-slot topology、角度決定性、reset、重複與晚到覆寫。產品條件為控制、切鏡頭、停止、overlay、publication、Review 不退步；工程條件為瀏覽器、asset/build、測試、除錯、失敗恢復、清理與維護成本。
