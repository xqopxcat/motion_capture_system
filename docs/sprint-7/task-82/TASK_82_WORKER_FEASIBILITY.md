# Task 82 Worker 可行性

現用 `@mediapipe/tasks-vision` 0.10.35。官方 Pose Landmarker Web 文件指出影像與影片的偵測呼叫為同步，會阻塞 UI 執行緒，並建議以 Web Worker 避免阻塞：https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js

可傳輸邊界：`HTMLVideoElement` 屬 DOM，不能直接交給 Dedicated Worker；`ImageBitmap` 可轉移，`OffscreenCanvas` 可在 Worker 使用，但實際 decoder、canvas、WebGL delegate 與模型初始化組合仍須逐瀏覽器驗證。套件型別接受 `ImageBitmap`，套件內部也參照 OffscreenCanvas/WebGL2；這只能證明候選介面存在，不能證明產品瀏覽器矩陣已通過。

後處理 Worker 不需移動 MediaPipe：RawCanonicalPose 是純結構化資料，Task 77 與 Task 79 可置於版本化訊息邊界後。其風險較低，但工作量太小時，structured clone、排程與往返可能吃掉效益。
