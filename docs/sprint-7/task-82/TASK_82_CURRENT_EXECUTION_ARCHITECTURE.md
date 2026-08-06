# Task 82 現行執行架構

```text
HTMLVideoElement
  -> requestVideoFrameCallback（缺少時 requestAnimationFrame）
  -> LatestFrameScheduler（最多 1 個執行中 + 1 個待處理，latest-frame-wins）
  -> captureVideoFrame
  -> MediaPipe detectForVideo（主執行緒、同步計算）
  -> RawCanonicalPose
  -> Task 77 temporal stabilization / quality
  -> Task 79 selected runtime angles
  -> Task 80 transparent Canvas overlay
```

`usePosePipeline` 以 generation、cameraSessionId、frameSequence 拒絕舊結果；停止、暫停、翻轉鏡頭及 dispose 都會輪替或終止 session。Raw 錄製仍從 RawCanonicalPose 收集，Filtered Runtime Pose 只供顯示。

主要風險是 `detectForVideo()` 同步佔用 UI 執行緒。現行排程已限制背壓，因此 Task 82 不應把「加 Worker」與既有 scheduling 成果混為一談。
