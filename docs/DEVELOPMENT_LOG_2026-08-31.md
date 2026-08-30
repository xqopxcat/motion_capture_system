# 2026-08-31 — 導航與 Compare 實作紀錄

## 範圍

本文件記錄 2026-08-31 檢視期間完成的產品修改，描述的是目前實作狀態，不代表視覺設計已完成最終驗收。在確立共用視覺風格之前，仍會分別檢視 Capture、Records、Viewer、Compare、Dashboard 與 Authentication 頁面的排版。

## 應用程式導航

- 新增響應式應用程式 Sidebar，使用者不再需要手動輸入網址才能前往主要頁面。
- 導航提供 Capture、Records、Compare、Dashboard 與 Authentication 入口。
- 桌面版使用常駐導航；較小的檢視區域使用響應式導航方式。
- Route 的責任歸屬及既有頁面行為沒有移入 Sidebar。

實作基準：`fea766cd7f8a4b0cdaa55e1e367b7e225fc58854`。

## Compare 工作區

### Record 選擇與頁面結構

- 頁面明確區分 Left Record 與 Right Record 的選擇。
- 使用者可以留在 Compare 頁面內選擇 Available Records。
- 兩筆 Record 都可使用後，Compare 會顯示左右並排的兩個 Viewer、共用播放控制、Right 手動 Offset 控制，以及全寬的 Basic metric difference 區塊。
- Metrics 維持在 Viewer 下方並使用完整寬度，避免表格因被放進狹窄側欄而必須水平捲動才能閱讀。
- 目前排版可供功能操作，但仍需納入後續頁面排版檢視。

### Video 與 Canvas 合成

- 每個 Viewer 都會將錄製影片放在下層，透明 Skeleton Canvas 疊在上層。
- Canvas 不再使用會遮住 `<video>` 元素的不透明背景。
- Overlay 不會攔截指標輸入。
- 本次修改沒有變更共用的正式 Skeleton Renderer、Landmark 投影或 Skeleton 連線定義。

### 播放與同步

- Left Record 是共用播放時鐘的權威來源。
- 左右 Skeleton 會分別依各自 Record 的 Pose timestamp 解析 Frame；實作不再假設兩份 Pose Dataset 具有相同的 Frame index 或取樣頻率。
- 手動 Sync Offset 會套用到已解析的 Right Pose Frame。
- Right video 是跟隨端。播放期間，只有當它與要求的 Right time 之間的偏移超過限定容差時，才會進行校正。
- 重複的 Render tick 仍可依需求重繪，但不會修改已保存的 Pose 或 Metric Artifact。
- 目前 Compare Skeleton 行為已完成目視檢查，可繼續進行其他頁面的檢視；這不構成實體裝置效能聲明。

目前實作：`56628c5fa96ef887d61c516b933fa5a55fe886c0`。

### Metrics

- Compare 繼續讀取各 Record 所提供的已保存 Metric Series。
- 先前曾嘗試以 Pose 資料重新計算缺少的 Compare Metrics，但該 fallback 已撤回。Compare 不應以第二條計算路徑默默取代已保存的分析 Artifact。
- 因此，受檢視 Record 原本已有的 Metrics（包含 Elbow 與 Wrist 數值）會繼續保留。
- Metric Registry 提供名稱時，Metric identifier 會顯示為人類可讀標籤；角度數值使用 `°` 顯示。
- `Missing` 仍表示所選 Record 的已保存 Metric Series 中沒有該項可比較數值。若要補齊 Knee、Hip、Ankle 或 Shoulder Series，必須明確處理分析與發布契約，而不是只在 Compare UI 加入 fallback。

## 實作期間完成的驗證

- 已新增或更新 Compare Record 選擇、Metric difference、Playback controller 與 VideoPlayer 的聚焦測試。
- 完整前端測試套件通過，共 64 個測試檔案、408 項測試。
- TypeScript Build 與 Production Build 均通過。
- 自動化測試涵蓋狀態與映射行為，但不能取代瀏覽器／裝置上的 Letterboxing、Decoder seek 或主觀同步感受檢查。

## 後續檢視項目

- 分別檢視 Capture、Records、Viewer、Compare、Dashboard 與 Authentication 頁面的排版。
- 了解各頁面排版後，再討論並定義共用視覺風格。
- 從分析管線邊界重新檢視 Compare Metric 的發布方式，使預期的 Joint Metrics 能一致地產生並保存。
- 使用影片長寬比不同且 Pose 取樣頻率不規則的 Record，繼續進行 Compare 視覺同步檢查。
