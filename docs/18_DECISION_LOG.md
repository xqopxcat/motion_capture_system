# 18_DECISION_LOG.md

# Motion Capture Platform - Architecture Decision Record (ADR)

---

| Item         | Value              |
| ------------ | ------------------ |
| Document     | 18_DECISION_LOG.md |
| Version      | 1.0                |
| Status       | Living Document    |
| Owner        | MengJu Lee         |
| Last Updated | 2026-06-26         |

---

# 1. Purpose

本文件記錄 Motion Capture Platform 的重要架構決策（Architecture Decision Records, ADR）。

目的：

* 保存架構決策背景
* 記錄選擇原因
* 避免重複討論
* 提供新成員與 AI Agent 理解系統設計

所有重大架構變更皆應新增 ADR，不應覆蓋既有紀錄。

---

# ADR-001 — Frontend Framework

## Status

Accepted

## Decision

Frontend 採用：

* React
* React Router
* Redux Toolkit
* RTK Query

## Alternatives Considered

* Next.js
* TanStack Router
* TanStack Query

## Rationale

本專案為單頁應用（SPA），不需要 SSR。

RTK Query 已能完整管理 Server State，避免同時維護 Redux 與另一套 Query Library。

React Router 生態成熟，足以滿足目前需求。

## Future Review

若未來需要：

* SSR
* SEO
* Edge Rendering

可重新評估 Next.js。

---

# ADR-002 — Feature-based Frontend Architecture

## Status

Accepted

## Decision

Frontend 採 Feature-based Architecture。

## Alternatives Considered

* Type-based Folder
* MVC
* Atomic Design

## Rationale

Feature-based 更符合產品功能邊界，也方便多人協作與 AI Agent 開發。

---

# ADR-003 — Engine Isolation

## Status

Accepted

## Decision

建立獨立 Engines：

* Pose
* Motion Model
* Metrics
* Visualization

## Alternatives Considered

* 將邏輯放入 React Components
* 將 Metrics 寫於 Viewer

## Rationale

降低 UI 與演算法耦合，便於測試、重用與未來搬移至 Backend 或 Web Worker。

---

# ADR-004 — Motion Model Layer

## Status

Accepted

## Decision

所有 Metrics 必須依賴 Motion Model，不直接依賴 Pose。

## Alternatives Considered

Pose → Metrics

## Rationale

建立平台自己的 Domain Model，避免綁定特定 Pose Engine，並提供一致的人體運動模型。

---

# ADR-005 — Metrics Framework

## Status

Accepted

## Decision

Metrics 採 Plugin-based Framework。

Metric 定義與 Metric Calculator 分離。

## Alternatives Considered

* 每個 Metrics 寫死於 Engine
* Utility Functions

## Rationale

方便新增運動分析項目，不需修改核心 Engine。

---

# ADR-006 — Visualization Framework

## Status

Accepted

## Decision

Visualization 採 Layer + Plugin Architecture。

## Alternatives Considered

單一 Canvas Renderer

## Rationale

將 Skeleton、Metrics、Annotation 等 Rendering 解耦，方便擴充 Heatmap、AI Coach 等未來功能。

---

# ADR-007 — Compare Mode

## Status

Accepted

## Decision

MVP 採 Side-by-side Compare。

Overlay Compare 延後。

## Alternatives Considered

Video Overlay

## Rationale

不同錄影角度、距離、人體比例與時間軸難以自動對齊。

Side-by-side 較容易理解，也更符合 MVP。

## Future Review

當自動 Alignment 成熟後，可重新評估 Overlay Compare。

---

# ADR-008 — Annotation Design

## Status

Accepted

## Decision

Annotation 採：

Timeline Marker + Right Drawer。

## Alternatives Considered

* Floating Bubble
* Inline Comment
* Left Sidebar

## Rationale

Timeline 提供時間定位，Drawer 提供完整編輯體驗，避免遮蔽影片。

---

# ADR-009 — Storage Strategy

## Status

Accepted

## Decision

大型檔案存放 Google Cloud Storage。

PostgreSQL 僅保存 Metadata。

## Alternatives Considered

Database BLOB

## Rationale

降低資料庫負擔，提高可擴充性與成本效益。

---

# ADR-010 — Upload Strategy

## Status

Accepted

## Decision

採 Signed URL Upload。

## Alternatives Considered

Backend Proxy Upload

## Rationale

降低 Backend 頻寬負擔，提升大型影片上傳效率。

---

# ADR-011 — Backend Responsibility

## Status

Accepted

## Decision

MVP Backend 不負責：

* Pose Detection
* Motion Model
* Metrics Calculation

## Alternatives Considered

Backend 全部分析

## Rationale

先以 Browser 完成分析，降低基礎設施成本，加快 MVP 驗證。

## Future Review

若需要多人協作、大量影片批次分析或背景工作，可搬移至 Backend Worker。

---

# ADR-012 — Pose Schema

## Status

Accepted

## Decision

完整保存 MediaPipe 33 個 Landmarks。

## Alternatives Considered

僅保存 17 個關鍵點

## Rationale

保留完整資料，提高未來擴充能力。

Rendering 可選擇不顯示部分節點，但 Storage 永遠保存完整資料。

---

# ADR-013 — State Management

## Status

Accepted

## Decision

RTK Query 管理 Server State。

Redux 僅管理 UI State。

## Alternatives Considered

* 全 Redux
* TanStack Query

## Rationale

明確分離 Server State 與 UI State，降低同步複雜度。

---

# ADR-014 — Styling Strategy

## Status

Accepted

## Decision

使用 CSS Modules。

## Alternatives Considered

* Tailwind CSS
* styled-components
* SCSS Modules

## Rationale

符合目前團隊開發習慣，降低依賴並維持元件樣式隔離。

---

# ADR-015 — Progressive TypeScript Adoption

## Status

Accepted

## Decision

採 JavaScript + TypeScript 漸進式導入。

## Alternatives Considered

全面 TypeScript

## Rationale

降低重構成本，新模組優先使用 TypeScript，舊模組逐步遷移。

---

# ADR-016 — API Design

## Status

Accepted

## Decision

API 採 Resource-oriented RESTful Design。

不暴露：

* Motion Model
* Metrics Engine
* Visualization Engine

## Alternatives Considered

直接暴露內部 Domain Objects。

## Rationale

保持 API 穩定性，使內部 Engine 可自由演進。

---

# ADR-017 — Repository Structure

## Status

Accepted

## Decision

採 Monorepo。

包含：

* docs
* frontend
* backend
* docker
* scripts

## Alternatives Considered

Frontend / Backend 分離 Repository。

## Rationale

集中管理文件、程式碼與 CI/CD，方便 AI Agent 與團隊協作。

---

# ADR-018 — Documentation First

## Status

Accepted

## Decision

所有重要功能需先更新 Design Docs，再開始實作。

## Alternatives Considered

Code First

## Rationale

維持架構一致性，讓 Human Developer 與 AI Agent 使用相同設計依據。

---

# 2. Future ADR Rules

新增 ADR 時應包含：

* Status
* Decision
* Alternatives Considered
* Rationale
* Future Review（Optional）

ADR 不應修改歷史紀錄。

若架構變更，新增新的 ADR 並標記舊 ADR 為：

* Superseded
* Deprecated

---

# 3. Related Documents

Depends On

* All Architecture Specifications (00–17)

Related

* 17_CODING_GUIDELINES.md
* 19_BACKLOG.md
* 20_AGENTS.md

---

# 4. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |
