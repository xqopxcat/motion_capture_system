# Task 82 實驗設計

原型位於 `frontend/src/experiments/poseExecution/`，沒有 production import。

- 協定 `pose-execution-eval.v1`：init、process、reset、dispose；process 保留外層 identity 與 RawCanonicalPose identity，但在任何 stabilization/angle 工作前嚴格比對 cameraSessionId、frameIndex、timestampMs。衝突由 `tryHandle()` 回傳保留 requestId 的 deterministic processing-error，不會靜默選邊。
- 候選 B：以可獨立放入 Worker 的 handler 執行 Task 77 filtered pose 與 Task 79 selected runtime angles。
- 背壓：最多一個 active、一個 pending；新幀取代 pending；session 變更或 dispose 後不發布舊結果。processing Promise rejection 只觸發 error callback，不發布失敗值，並在釋放 active 後繼續最新 pending 幀。
- 正確性：33-slot 2D/3D 拓樸、slot/id、metric profile、來源時間語意由既有引擎與 focused tests 覆蓋。
- 量測：有限樣本保存，報告 min/median/mean/p95/max；禁止逐幀 console log。

本 CI 原型刻意不啟動真實 camera、MediaPipe GPU 或瀏覽器 Worker，避免將 Node 模擬誤報為產品效能。
