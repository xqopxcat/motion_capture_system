# Task 82 瀏覽器相容性

尚未核准任何 Worker 推論瀏覽器矩陣。需在 Task 84 或後續核准工作逐一驗證：

- 產品支援版本的 Chrome/Edge、Firefox、桌面 Safari、iOS Safari；
- ImageBitmap 建立與 transfer、OffscreenCanvas、Worker 內 WebGL2/WASM；
- camera frame 擷取、權限／頁面背景化、context loss、模型資產載入；
- GPU/CPU delegate 行為、記憶體峰值、裝置熱節流與恢復。

MDN 將 ImageBitmap、OffscreenCanvas 與 Worker 能力分別文件化，但功能可用不代表 MediaPipe 組合相容：https://developer.mozilla.org/docs/Web/API/ImageBitmap 、https://developer.mozilla.org/docs/Web/API/OffscreenCanvas

因此不得宣稱跨瀏覽器可採用，也不得宣稱已完成物理裝置驗證。

失敗策略是維持目前 production main-thread path；實驗 Worker 初始化、asset、GPU 或 API 失敗時 fail closed，不阻擋 Capture。camera permission、route unmount、record stop、background tab、memory pressure 與 late message 都必須沿用 session/dispose 拒絕規則。這裡只記錄策略，未加入 production fallback。
