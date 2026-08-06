# Task 82 實驗結果

環境：Windows 開發工作區、Vitest/Node 合成 33-landmark Pose；非物理裝置、非 camera、非正式瀏覽器 Worker。

通過項目：14 個 focused validation 覆蓋版本拒絕、初始化順序、三個 identity 欄位的 pre-processing 驗證、成功結果內部 identity 一致、固定拓樸、metric 選擇、reset/dispose、錯誤恢復、舊 session 抑制、Promise rejection 後續行、latest-frame-wins 與有限統計。identity mismatch 測試直接證明 Task 77 transform 未執行，且下一個合法請求不受污染。序列化 harness 明確分離 2 次 warm-up 與 5 次 CI 樣本，提供 clone/JSON reference 的 min/median/mean/p95/max 與 JSON payload bytes；正常 CI 不設牆鐘門檻、不輸出逐幀資料。

baseline 對比：production baseline 已有單一 in-flight 與 latest pending；實驗 queue 沒有再降低 queue bound。post-processing handler 與 production 共用 Task 77/79，因此輸出契約一致，但本環境沒有啟動真實瀏覽器 Worker，不能提供可信的跨執行緒 round-trip 數值。JSON 僅為 payload-size/reference，不是建議傳輸。Raw/Filtered/angle 都是每幀小物件，typed array 可能減少 allocation，但本 task 不更改 schema。

未取得項目：MediaPipe Worker 初始化／推論 p95、ImageBitmap 轉移 p95、UI long-task、有效 FPS、熱節流、iOS Safari/Android Chrome/桌面瀏覽器矩陣。故沒有資料可證明達到 2 ms 或 10% Adopt 門檻。

結論：後處理 Worker 的資料契約可行，但效益證據不足；MediaPipe Worker 仍需瀏覽器與物理裝置 spike。
