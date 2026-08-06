# Task 82 最終建議

Overall decision: Defer.

保留目前主執行緒 MediaPipe 與既有有界排程，不把實驗接入 production。後處理 Worker 已證明可維持資料與生命週期契約，但目前工作量不足以證明淨收益；MediaPipe Worker 更可能改善 UI 阻塞，卻仍缺產品瀏覽器矩陣與物理裝置 p95 證據。

重新開啟條件：Task 84 觀測到推論造成 p95 主執行緒工作超過預算、long task 或有效 FPS 問題，且隔離瀏覽器 prototype 能通過相容性、stale/cancellation 與記憶體測試。屆時應優先評估 C，而非先搬移輕量後處理。
