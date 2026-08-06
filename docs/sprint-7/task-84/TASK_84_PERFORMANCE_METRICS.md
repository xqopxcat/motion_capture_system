# Task 84 效能指標

Development Capture 以 `?captureDiagnostics=1` 開啟面板，按 Reset scenario 後執行單一 scenario，再 Copy JSON。樣本容量 300、面板 500 ms 更新、不逐幀 log、不上傳 Raw Pose/video。

記錄 camera FPS proxy、inference request/completion FPS、accepted publications、render FPS、inference/angle/render/source-to-publish與overlay proxy的 p50/p95、Task 77 processing summary、long task >50 ms（API 支援時）、skip/coalesce/replace/stale、max pending、record duration；memory 只在 browser API 有可信數據時記錄。`sessionMismatchRejectedCount:null` 表示目前無獨立可觀測 counter，不能解讀為 0。

面板 camera/source-to-overlay 是 browser observation proxy，不是 sensor latency。Task 77 snapshot 目前只有 count/mean/max，p50/p95 unavailable 必須照實記錄。Task 82 只有在 UI blocking、long tasks與 inference 同時發生、accepted FPS 不可用且 post-processing/render 非瓶頸時才重新開啟 MediaPipe Worker backlog；不得在 Task 84 自動 migration。
