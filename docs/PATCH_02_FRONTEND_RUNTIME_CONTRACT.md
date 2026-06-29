# Patch 02 — Frontend Runtime / Component Contract

| 項目 | 內容 |
| --- | --- |
| Patch | Patch 02 |
| Purpose | Frontend Runtime / Component Contract |
| Status | Implemented |
| Scope | Boundary skeletons only |

---

## 1. Runtime State Ownership

Patch 02 定義前端 runtime state 的 ownership boundary，讓 Sprint 1+ 可以在不破壞架構的前提下實作產品功能。

| State / Data | Owner | Storage Rule |
| --- | --- | --- |
| PlaybackState | Playback controller / feature state | 可由 controller hook 或未來 Redux UI slice 管理 |
| FrameState | Frame controller / feature state | 可由 controller hook 或未來 Redux UI slice 管理 |
| CaptureRuntimeState | Capture pipeline controller | Runtime only |
| UploadRuntimeState | Upload pipeline controller | Runtime only；API request 必須透過 RTK Query services |
| ViewerRuntimeState | Viewer feature composition | 組合 playback、frame、visualization mode |
| CompareRuntimeState | Compare sync controller / feature state | 不由 VideoPlayer 擁有 |
| Pose Dataset | Loader / engine memory | 不得放入 Redux |
| Metric Series | Loader / engine memory | 不得放入 Redux |
| RenderContext | Visualization bridge | 傳入 SkeletonCanvas / Visualization Engine，不由 page 直接操作 |

Redux 仍只保留 UI state。Server state 仍由 RTK Query 管理。

---

## 2. Controller Hook Responsibilities

Patch 02 新增以下 controller hook skeletons：

- `usePlaybackController`
- `useFrameController`
- `useCapturePipeline`
- `useRecordUploadPipeline`
- `usePoseLoader`
- `useMetricSeriesLoader`
- `useCompareSyncController`

### `usePlaybackController`

負責定義 playback user intent 的邊界，例如 play、pause、seek time、playback speed change。

目前只提供 minimal state 與 intent handler skeleton，不實作真實播放 loop。

### `useFrameController`

負責定義 current frame ownership 與 frame navigation intent。

目前只提供 frame state 與 basic intent handler skeleton，不連動 video element 或 timeline playback。

### `useCapturePipeline`

負責保留 Capture pipeline 的 runtime boundary。

目前不實作 camera access、MediaRecorder、MediaPipe、pose detection 或 upload flow。

### `useRecordUploadPipeline`

負責保留 upload runtime boundary。

目前不 request signed URL、不上傳檔案、不呼叫 API。未來必須透過 RTK Query services 串接 API。

### `usePoseLoader`

負責保留 Pose Dataset loader boundary。

Pose Dataset 未來只能放在 loader / engine memory，不得放入 Redux。

### `useMetricSeriesLoader`

負責保留 Metric Series loader boundary。

Metric Series 未來只能放在 loader / engine memory，不得放入 Redux。

### `useCompareSyncController`

負責保留 Compare sync offset ownership boundary。

目前不實作 compare sync algorithm。

---

## 3. Component Responsibilities

Patch 02 新增以下 shared component skeletons：

- `VideoPlayer`
- `Timeline`
- `PlaybackControls`
- `SkeletonCanvas`
- `MetricPanel`
- `AnnotationDrawer`
- `ComparePanel`

### `VideoPlayer`

- Controlled by playback props。
- 可接收 video src 與 time update callback。
- 不擁有 global playback state。
- 不計算 metrics。
- 不呼叫 API。
- 不實作真實 playback loop。

### `Timeline`

- Controlled by currentFrame props。
- 只發出 seek frame intent。
- 可顯示外部提供的 annotation markers。
- 不擁有 annotation editing state。
- 不計算 metrics。

### `PlaybackControls`

- 只發出 user intent，例如 play、pause、previous frame、next frame、speed change。
- 不直接控制 video element。
- 不直接操作 canvas。
- 不擁有 global playback state。

### `SkeletonCanvas`

- 是 UI 與未來 Visualization Engine 的 bridge。
- 接收 RenderContext placeholder。
- 目前不畫 skeleton。
- 目前不呼叫 Visualization Engine。
- 未來必須透過 Visualization Engine 進行 canvas rendering。

### `MetricPanel`

- 只顯示外部提供的 metrics。
- 不計算 metrics。
- 不讀 Pose Dataset 或 Metric Series。

### `AnnotationDrawer`

- 只提供 annotation UI shell 與 intent callbacks。
- 不直接修改 Timeline。
- 不實作 Annotation CRUD API。

### `ComparePanel`

- 只提供 Compare UI shell 與 sync offset intent callback。
- 不渲染 video。
- 不計算 metrics。
- 不實作 compare sync algorithm。

---

## 4. Engine Boundaries

Engines 必須保持 pure TypeScript / JavaScript boundary。

禁止：

- Engine imports React。
- Engine imports Redux。
- Engine imports RTK Query。
- Engine imports feature modules。
- Engine imports page modules。
- Engine 直接操作 UI component state。

允許：

- Engine 使用 `types/`。
- Engine 使用 `utils/`。
- Feature / hook 在未來呼叫 Engine。
- Component 透過 props 接收 Engine 產出的 display-ready data。

Visualization Engine 未來負責 rendering。`SkeletonCanvas` 只能作為 bridge，不得自行實作 skeleton drawing。

---

## 5. Explicit Forbidden Implementation Before Sprint 1

Patch 02 與 Sprint 1 前不得實作：

- Camera access。
- MediaRecorder。
- MediaPipe integration。
- Pose detection。
- Motion Model calculation。
- Metrics calculation。
- Real playback loop。
- Compare sync algorithm。
- Upload pipeline。
- API endpoints beyond Sprint 0 baseline。
- Direct `fetch` in components。
- Pose Dataset 或 Metric Series 存入 Redux。
- New route structure。
- Backend changes。
- Docker Compose changes。
- Unapproved third-party packages。

---

## 6. Verification Notes

Patch 02 應以 compile 與 boundary review 驗證：

```powershell
cd frontend
npm install
npm run build
npm run dev
```

Architecture review commands：

```powershell
rg "fetch\(" frontend/src
```

PowerShell 內建 fallback：

```powershell
Get-ChildItem frontend/src -Recurse -File | Select-String -Pattern "fetch\("
Get-ChildItem frontend/src/engines -Recurse -File | Select-String -Pattern "from ['""]react|@reduxjs|react-redux|@reduxjs/toolkit"
```

macOS / Linux shell 可使用：

```bash
rg "fetch\(" frontend/src
rg "from ['\"]react|@reduxjs|react-redux|@reduxjs/toolkit" frontend/src/engines
```

Note：PowerShell 對 quote escaping 較敏感；若 `rg` pattern 解析異常，請使用上方 `Get-ChildItem` + `Select-String` fallback。

Expected result：

- Frontend compiles。
- Existing route shells remain unchanged。
- No backend files changed。
- No existing design docs modified。
- No product feature logic implemented。

