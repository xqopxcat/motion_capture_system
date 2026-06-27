# 05_TECH_STACK_SPEC.md

# Motion Capture Platform - Technology Stack Specification

---

| Item         | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Document     | 05_TECH_STACK_SPEC.md                                                       |
| Version      | 1.0                                                                         |
| Status       | Draft                                                                       |
| Owner        | MengJu Lee                                                                  |
| Last Updated | 2026-06-26                                                                  |
| Depends On   | 00_MASTER_CONTEXT.md、03_SYSTEM_ARCHITECTURE.md、04_ANALYSIS_PIPELINE_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 採用的技術棧（Technology Stack）。

目的包括：

* 統一開發技術
* 降低技術選型歧異
* 提供後續 Frontend / Backend Architecture 的基礎
* 作為 Codex 與 AI Agent 的技術依據

本文件僅討論技術選型與使用原則，不討論實作細節。

---

# 2. Design Principles

技術選型遵循以下原則：

* Web-first
* Production Ready
* Long-term Maintainability
* Modular
* Open Ecosystem
* Strong Community Support
* Easy Local Development

避免：

* 冷門框架
* 過度依賴 Vendor
* 難以維護的技術

---

# 3. Overall Technology Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Frontend         | React                   |
| Language         | JavaScript + TypeScript |
| Routing          | React Router            |
| State Management | Redux Toolkit           |
| Data Fetching    | RTK Query               |
| Styling          | CSS Modules（初期）         |
| Canvas Rendering | HTML5 Canvas            |
| Backend          | FastAPI                 |
| Database         | PostgreSQL              |
| Object Storage   | Google Cloud Storage    |
| Authentication   | Google OAuth            |
| Deployment       | Docker                  |

---

# 4. Frontend Stack

## React

React 作為整個 Web Application 的核心框架。

原因：

* 生態成熟
* Component-based
* 與 Canvas 整合容易
* 良好的效能
* 長期維護容易

---

## JavaScript + TypeScript

專案採用 JavaScript 與 TypeScript 混合開發。

原因：

* 提供型別安全（Type Safety）
* 提升大型專案可維護性
* 改善開發體驗（IDE 支援、自動補全）
* 允許逐步導入與遷移

所有新開發模組應優先使用 TypeScript。

---

## React Router

負責：

* Page Routing
* Nested Routes
* Route Guard

目前主要 Routes：

```text
/login
/dashboard
/capture
/records
/records/:recordId
/compare
```

---

## Redux Toolkit

負責：

* Global State
* UI State
* Session State

例如：

* Current User
* Current Record
* Viewer State
* Compare State

---

## RTK Query

作為唯一 Server State Solution。

負責：

* API Requests
* Cache
* Auto Refetch
* Mutation
* Optimistic Update（Future）

本專案不使用：

* React Query
* SWR

避免多套資料管理方式並存。

---

## CSS Modules

MVP 採用 CSS Modules。

原因：

* 無 Runtime Cost
* 命名隔離（避免全域污染）
* 易於理解與維護
* 與現有 CSS 生態完全相容
* 適合中大型專案逐步擴展

### 為何不使用 SCSS

* 增加額外編譯層與工具鏈複雜度
* Nesting 與變數功能在現代 CSS 已逐步原生支援
* 容易導致過度巢狀與樣式耦合
* 對本專案 MVP 階段價值有限

### 為何不使用 styled-components

* 存在 Runtime Cost（CSS-in-JS）
* 影響效能（特別是在大量 Canvas + UI 更新場景）
* Debug 與 DevTools 可讀性較差
* 樣式與邏輯過度耦合，降低長期可維護性

### 為何不使用 Tailwind CSS

* Utility-first 風格會導致 JSX 過於冗長
* 可讀性下降（特別是複雜 UI）
* 設計語意不明確（缺乏語意化 class）
* 對於需要長期維護與團隊協作的專案不利
* 初期沒有 Design System 時容易產生不一致樣式

---

## HTML5 Canvas

Visualization Engine 採用 Canvas Rendering。

主要負責：

* Skeleton Overlay
* Joint Overlay
* Angle Labels
* Compare Visualization

Canvas 不負責：

* Metrics Calculation
* Annotation Data

---

# 5. AI / Motion Analysis Stack

## Pose Engine

目前：

MediaPipe Pose Landmarker。

原因：

* Browser 支援成熟
* 效能佳
* 可取得 2D / 3D Pose

未來可替換：

* MoveNet
* OpenPose
* Apple Vision
* Azure Kinect

平台 Architecture 不依賴特定 Pose Engine。

---

## Motion Model

Motion Model 為平台 Domain Layer。

不依賴任何第三方 Library。

由專案自行維護。

---

## Metrics Engine

自行開發。

所有運科指標皆建立於 Motion Model。

避免直接依賴 MediaPipe Output。

---

# 6. Backend Stack

## FastAPI

Backend 採用 FastAPI。

主要負責：

* Authentication
* REST API
* Signed URL
* Metadata
* Record Management

MVP 不負責：

* Pose Detection
* Metrics Calculation

---

# 7. Database

採用：

PostgreSQL。

用途：

* User
* Record Metadata
* Dashboard Summary
* Annotation
* Tags

大型檔案不存放於 Database。

---

# 8. Object Storage

採用：

Google Cloud Storage。

保存：

* Video
* Pose JSON
* Metric Series JSON
* Thumbnail

所有 Upload 採：

Signed URL。

避免 Backend 成為檔案傳輸瓶頸。

---

# 9. Authentication

採用：

Google OAuth。

MVP 不支援：

* Email / Password
* Facebook Login
* Apple Login

後續可擴充其他 Identity Provider。

---

# 10. Deployment

開發環境：

Docker Compose。

正式環境：

Docker Container。

Frontend 與 Backend 可獨立部署。

---

# 11. Development Tools

建議工具：

* Visual Studio Code
* ESLint
* Prettier
* npm
* Git
* GitHub

Codex 將依據本文件產生專案結構。

---

# 12. Future Considerations

未來可評估：

* Web Worker（大型 Metrics 計算）
* WebAssembly（高效運算）
* Backend Analysis Queue
* Kubernetes
* CDN

上述皆不影響目前 Architecture。

---

# 13. Related Documents

Depends On

* 00_MASTER_CONTEXT.md
* 03_SYSTEM_ARCHITECTURE.md
* 04_ANALYSIS_PIPELINE_SPEC.md

Related

* 06_DATA_MODEL_SPEC.md
* 11_API_SPEC.md
* 13_FRONTEND_ARCHITECTURE.md
* 14_BACKEND_ARCHITECTURE.md

---

# 14. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Patch 1 Addendum — Sprint 0 Baseline Reference

Status: Patch 1 Applied  
Source: SPEC_PATCH_PLAN_01_CRITICAL_ITEMS.md

本節僅補充 Sprint 0 的技術基準，不更換既有技術棧。

## Sprint 0 Technical Baseline

Sprint 0 需建立：

* Monorepo baseline
* Frontend React app shell
* Backend FastAPI app shell
* Docker Compose baseline
* PostgreSQL local service
* Frontend route shell
* Backend health check endpoint
* RTK Query base API setup
* Basic environment configuration

## Technology Constraints

Sprint 0 不得引入：

* Next.js
* TanStack Query
* Tailwind CSS
* styled-components
* SCSS migration
* Backend analysis queue
* Non-approved third-party framework

