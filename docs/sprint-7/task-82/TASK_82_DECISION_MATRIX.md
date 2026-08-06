# Task 82 選項矩陣

| 架構 | MediaPipe | stabilization / angle | rendering | 主執行緒效益與量測 | clone/相容性 | 生命週期／正確性／成本 | 可觀測性 | MVP 建議 |
|---|---|---|---|---|---|---|---|---|
| A 現行 | main | main / main | main Canvas | baseline；已有有界 queue，未移除同步 inference | 無 clone；現行瀏覽器路徑 | 已測 session/stale；最低成本與風險 | 現有 diagnostics | 保留 |
| B 後處理 Worker | main | Worker / Worker | main Canvas | 只移出次毫秒純計算；未證明達 2 ms/10% | 每幀 Raw/Filtered clone；Worker 普遍可用 | prototype 契約通過；中等訊息／reset 成本 | timing 可回傳，跨緒除錯較難 | Defer |
| C inference Worker | Worker | Worker / Worker | main Canvas | 預期最大，但沒有實測 round-trip/FPS | ImageBitmap/OffscreenCanvas/WASM/delegate 待矩陣 | model/asset/context/termination 高成本；frame 關閉風險 | Worker 與 GPU/WASM 除錯困難 | Defer |
| D Worker + OffscreenCanvas | Worker | Worker / Worker | Worker OffscreenCanvas | 未證明 Canvas 是瓶頸 | 相容組合風險最高 | UI/resize/context loss 耦合；高正確性風險與高工期 | 最難檢查 | Reject |
| E 僅 scheduling | main | main / main | main Canvas | production 已具 rVFC、throttle、in-flight/latest | 無新增 clone；現行相容性 | 已測且最低複雜度 | coalesce/skip/stale 已統計 | 已存在，不新增變更 |

矩陣中的子選項用語不取代整體唯一決策。
