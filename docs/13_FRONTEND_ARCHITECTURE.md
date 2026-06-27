# 13_FRONTEND_ARCHITECTURE.md

# Motion Capture Platform - Frontend Architecture Specification

---

| Item         | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| Document     | 13_FRONTEND_ARCHITECTURE.md                                          |
| Version      | 1.0                                                                  |
| Status       | Draft                                                                |
| Owner        | MengJu Lee                                                           |
| Last Updated | 2026-06-26                                                           |
| Depends On   | 05_TECH_STACK_SPEC.md、11_VISUALIZATION_ENGINE_SPEC.md、12_API_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的前端架構。

目的為：

* 定義 React Application Structure
* 定義 Feature Module 邊界
* 定義 RTK Query 與 Redux Toolkit 的使用方式
* 定義 Engines 在前端中的位置
* 建立 Codex Sprint 0 的前端實作依據

本文件不討論：

* UI 視覺設計
* Component 細節
* Backend 實作
* Database Schema

---

# 2. Frontend Architecture Principles

前端設計遵循以下原則：

* Feature-based
* Engine-oriented
* Explicit State Boundary
* Reusable Visualization
* API Client Isolation
* Testable
* Incremental TypeScript Adoption

前端不應將所有邏輯塞進 Pages 或 Components。

---

# 3. Technology Stack

前端採用：

* React
* JavaScript + TypeScript
* React Router
* Redux Toolkit
* RTK Query
* CSS Modules
* HTML5 Canvas

所有新模組優先使用 TypeScript。

---

# 4. High-Level Structure

```text
frontend/

└── src/

    ├── app/

    ├── routes/

    ├── pages/

    ├── features/

    ├── engines/

    ├── services/

    ├── store/

    ├── components/

    ├── hooks/

    ├── types/

    └── utils/
```

---

# 5. App Layer

`app/` 負責：

* App Root
* Providers
* Router Setup
* Global Layout
* Error Boundary

範例：

```text
app/

├── App.tsx
├── providers.tsx
└── router.tsx
```

---

# 6. Routes

`routes/` 定義所有 Route Config。

主要 Routes：

```text
/login
/dashboard
/capture
/records
/records/:recordId
/compare
```

Route 不包含大量邏輯。

Route 只負責載入 Page。

---

# 7. Pages

`pages/` 放置頁面級 Component。

```text
pages/

├── LoginPage/
├── DashboardPage/
├── CapturePage/
├── RecordsPage/
├── RecordViewerPage/
└── ComparePage/
```

Page 負責組合 Feature Components。

不直接實作 Domain Logic。

---

# 8. Features

`features/` 為產品功能模組。

```text
features/

├── auth/
├── capture/
├── records/
├── viewer/
├── compare/
├── annotations/
├── dashboard/
└── tags/
```

每個 Feature 可包含：

```text
components/
hooks/
store/
types/
utils/
```

---

# 9. Engines

`engines/` 放置平台核心 Engine。

```text
engines/

├── pose/
├── motion-model/
├── metrics/
└── visualization/
```

Engines 不依賴 Pages。

Engines 不依賴 UI Components。

Engines 可被 Capture、Viewer、Compare 共用。

---

## 9.1 Pose Engine

負責：

* MediaPipe Adapter
* Pose Dataset Generation
* Pose Schema Mapping

---

## 9.2 Motion Model Engine

負責：

* Pose → Motion Model
* Segment Generation
* Body Center
* Kinematic Chain

---

## 9.3 Metrics Engine

負責：

* Metric Definition Library
* Metric Registry
* Metric Calculators
* Metric Series
* Metric Summary

---

## 9.4 Visualization Engine

負責：

* Render Context
* Render Plugins
* Canvas Layers
* Skeleton Layer
* Metric Layer
* Annotation Layer

---

# 10. Services

`services/` 放置 API Client。

```text
services/

├── authApi.ts
├── recordsApi.ts
├── uploadsApi.ts
├── annotationsApi.ts
├── tagsApi.ts
├── dashboardApi.ts
└── compareApi.ts
```

所有 API Request 應透過 RTK Query。

不得在 Component 中直接呼叫 `fetch`。

---

# 11. Store

`store/` 管理 Redux Store。

```text
store/

├── store.ts
├── rootReducer.ts
└── middleware.ts
```

Redux Toolkit 管理：

* UI State
* Viewer State
* Compare State
* Capture State

Server State 由 RTK Query 管理。

---

# 12. State Boundary

## Server State

由 RTK Query 管理。

例如：

* User
* Records
* Annotations
* Tags
* Dashboard Summary

---

## Client State

由 Redux Slice 或 Component State 管理。

例如：

* Current Frame
* Playback State
* Selected Joint
* Compare Sync Offset
* Capture Recording State

---

## Runtime Data

由 Engine / Hook 管理。

例如：

* Video Stream
* Pose Frames
* Canvas Context
* Metric Series Cache

---

# 13. RTK Query API Modules

建議建立：

```text
api/

├── authApi
├── recordsApi
├── uploadsApi
├── annotationsApi
├── tagsApi
├── dashboardApi
└── compareApi
```

每個 API Module 對應 `12_API_SPEC.md` 的一組 Resource。

---

# 14. Capture Architecture

Capture Page 使用：

* Camera Hook
* MediaRecorder Hook
* Pose Engine
* Metrics Engine
* Visualization Engine
* Upload API

流程：

```text
Camera

↓

Pose Engine

↓

Motion Model

↓

Metrics Engine

↓

Visualization Engine

↓

Upload
```

Capture 不直接操作 Backend Storage。

只透過 API 取得 Signed URL。

---

# 15. Viewer Architecture

Viewer 使用：

* Record Detail API
* Video Player
* Pose Loader
* Metrics Loader
* Visualization Engine
* Annotation Feature

流程：

```text
Record Detail

↓

Video

↓

Pose

↓

Metrics

↓

Render Context

↓

Visualization Engine
```

---

# 16. Compare Architecture

Compare 使用：

* Compare API
* Two Record Data Loaders
* Shared Playback Controller
* Sync Offset
* Two Visualization Contexts

Compare V1 採：

Side-by-side。

不使用 Overlay Compare。

---

# 17. Dashboard Architecture

Dashboard 使用：

* Dashboard API
* Metric Summary
* Trend Charts
* Recent Records

Dashboard 不讀取：

* Video
* Pose
* Metric Series

僅依賴 Summary Data。

---

# 18. TypeScript Strategy

專案採：

JavaScript + TypeScript。

新開發模組優先：

TypeScript。

建議：

* Engines 使用 TypeScript
* API Types 使用 TypeScript
* Core Domain Types 使用 TypeScript
* Legacy / Simple UI 可暫用 JavaScript

---

# 19. Styling Strategy

使用：

CSS Modules。

命名原則：

```text
ComponentName.module.css
```

不使用：

* styled-components
* Tailwind CSS
* SCSS

原因見：

05_TECH_STACK_SPEC.md。

---

# 20. Folder Dependency Rules

禁止：

* engines 依賴 pages
* engines 依賴 features
* services 依賴 pages
* components 呼叫 fetch
* pages 實作 domain logic

允許：

* pages 使用 features
* features 使用 engines
* features 使用 services
* engines 使用 types / utils

---

# 21. Future Extensions

未來可新增：

* Web Worker
* WASM Metrics Engine
* 3D Visualization
* Overlay Compare
* AI Coach Panel

不需修改整體前端架構。

---

# 22. Related Documents

Depends On

* 05_TECH_STACK_SPEC.md
* 11_VISUALIZATION_ENGINE_SPEC.md
* 12_API_SPEC.md

Related

* 14_BACKEND_ARCHITECTURE.md
* 15_UI_COMPONENT_SPEC.md
* 16_CODING_GUIDELINES.md

---

# 23. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |
