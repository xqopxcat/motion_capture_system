# 19_BACKLOG.md

# Motion Capture Platform - Product Backlog

---

| Item         | Value           |
| ------------ | --------------- |
| Document     | 19_BACKLOG.md   |
| Version      | 1.2             |
| Status       | Living Document |
| Owner        | MengJu Lee      |
| Last Updated | 2026-06-26      |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 Product Backlog。

目的：

* 管理產品 Roadmap
* 管理 Engineering Backlog
* 提供 AI Agent Sprint Planning
* 作為 MVP Scope 控制依據

Backlog 依照：

* MVP
* V1
* V2
* Future

逐步推進。

---

# 2. Priority Definition

| Priority | Description    |
| -------- | -------------- |
| P0       | 必須完成（Blocking） |
| P1       | MVP 必要         |
| P2       | MVP 後優先        |
| P3       | Nice to Have   |
| P4       | Future         |

---

# 3. Status Definition

| Status      | Description |
| ----------- | ----------- |
| Todo        | 尚未開始        |
| In Progress | 開發中         |
| Review      | Review 中    |
| Done        | 已完成         |
| Deferred    | 延後          |

---

# 4. MVP Roadmap

## Epic 1 — Foundation

| Feature             | Priority | Status |
| ------------------- | -------- | ------ |
| Repository Setup    | P0       | Todo   |
| Frontend Project    | P0       | Todo   |
| Backend Project     | P0       | Todo   |
| Docker Environment  | P0       | Todo   |
| CI / GitHub Actions | P1       | Todo   |

---

## Epic 2 — Authentication

| Feature            | Priority | Status |
| ------------------ | -------- | ------ |
| Google OAuth Login | P0       | Todo   |
| Session Management | P0       | Todo   |
| Logout             | P1       | Todo   |

---

## Epic 3 — Capture

| Feature          | Priority | Status |
| ---------------- | -------- | ------ |
| Camera Preview   | P0       | Todo   |
| MediaRecorder    | P0       | Todo   |
| Pose Detection   | P0       | Todo   |
| Skeleton Overlay | P0       | Todo   |
| Angle Overlay    | P1       | Todo   |
| Recording Timer  | P1       | Todo   |
| Upload Progress  | P1       | Todo   |

---

## Epic 4 — Record Management

| Feature       | Priority | Status |
| ------------- | -------- | ------ |
| Record List   | P0       | Todo   |
| Record Detail | P0       | Todo   |
| Edit Metadata | P1       | Todo   |
| Delete Record | P1       | Todo   |
| Search        | P1       | Todo   |
| Tag Filter    | P2       | Todo   |

---

## Epic 5 — Viewer

| Feature            | Priority | Status |
| ------------------ | -------- | ------ |
| Video Playback     | P0       | Todo   |
| Timeline           | P0       | Todo   |
| Playback Controls  | P0       | Todo   |
| Skeleton Rendering | P0       | Todo   |
| Metrics Panel      | P1       | Todo   |
| Joint Selection    | P1       | Todo   |
| Frame Navigation   | P1       | Todo   |

---

## Epic 6 — Annotation

| Feature           | Priority | Status |
| ----------------- | -------- | ------ |
| Timeline Marker   | P1       | Todo   |
| Annotation Drawer | P1       | Todo   |
| Create Annotation | P1       | Todo   |
| Edit Annotation   | P1       | Todo   |
| Delete Annotation | P1       | Todo   |

---

## Epic 7 — Compare

| Feature              | Priority | Status |
| -------------------- | -------- | ------ |
| Side-by-side Compare | P1       | Todo   |
| Shared Playback      | P1       | Todo   |
| Sync Offset          | P1       | Todo   |
| Difference Metrics   | P1       | Todo   |

---

## Epic 8 — Dashboard

| Feature        | Priority | Status |
| -------------- | -------- | ------ |
| Recent Records | P1       | Todo   |
| Statistics     | P1       | Todo   |
| Metric Summary | P1       | Todo   |

---

# 5. V1 Roadmap

## Motion Analysis

| Feature            | Priority |
| ------------------ | -------- |
| Joint Velocity     | P2       |
| Joint Acceleration | P2       |
| Segment Velocity   | P2       |
| Center of Mass     | P2       |

---

## Viewer

| Feature            | Priority |
| ------------------ | -------- |
| Heatmap            | P2       |
| Motion Trail       | P2       |
| Multi Metric Panel | P2       |

---

## Compare

| Feature                 | Priority |
| ----------------------- | -------- |
| Auto Sync               | P2       |
| Frame Difference        | P2       |
| Metric Trend Comparison | P2       |

---

## Dashboard

| Feature           | Priority |
| ----------------- | -------- |
| Personal Progress | P2       |
| Historical Trend  | P2       |
| Best Performance  | P2       |

---

# 6. V2 Roadmap

## AI Features

| Feature           | Priority |
| ----------------- | -------- |
| AI Motion Review  | P3       |
| AI Coaching       | P3       |
| AI Insight        | P3       |
| AI Recommendation | P3       |

---

## Collaboration

| Feature        | Priority |
| -------------- | -------- |
| Share Record   | P3       |
| Team Workspace | P3       |
| Coach Review   | P3       |

---

## Reporting

| Feature      | Priority |
| ------------ | -------- |
| PDF Report   | P3       |
| CSV Export   | P3       |
| Video Export | P3       |

---

# 7. Future Roadmap

可能方向：

* 3D Viewer
* Multi-camera Capture
* IMU Integration
* Force Plate Integration
* Apple Vision Pro
* VR Replay
* AR Coaching
* Real-time Coach
* Live Streaming Analysis
* Organization Management
* Athlete Management

---

# 8. Technical Considerations (Pre-implementation)

目前專案尚未開始開發，因此不存在實際的技術債。

以下項目為「預期技術考量」與「未來可能優化方向」，用於提前規劃架構與避免未來產生技術債：

* JavaScript → TypeScript Migration（建議初期即採用 TypeScript 避免轉換成本）
* Visualization Performance Optimization（高頻繪製需注意效能）
* Web Worker Support（避免主執行緒阻塞）
* WASM Metrics Engine（高效能運算預留擴展空間）
* Bundle Size Optimization（前端載入效能）
* Lazy Loading（模組與頁面延遲載入）

---

# 9. Out of Scope (MVP)

以下功能不納入 MVP：

* Overlay Compare
* AI Coach
* Multi-user Collaboration
* Real-time Multiplayer
* Multi-camera Synchronization
* Backend Motion Analysis
* Organization Management
* Payment System

---

# 10. Sprint Planning Rules

每次 Sprint：

優先：

P0

↓

P1

↓

P2

不得：

直接跳做：

P3

或

Future Feature。

---

# 11. AI Development Rules

AI Agent：

新增功能前：

必須：

1. 檢查本 Backlog。
2. 確認 Feature Priority。
3. 確認是否屬於 MVP Scope。
4. 若屬於 Out of Scope，不得自行實作。

---

# 12. Release Milestones

## MVP

* Capture
* Viewer
* Annotation
* Compare (Side-by-side)
* Dashboard
* Google Login
* Upload
* Record Management

---

## Version 1.0

* 完整 Motion Analysis
* Heatmap
* Motion Trail
* Auto Sync
* Historical Dashboard

---

## Version 2.0

* AI Coach
* Team Workspace
* Report Generation
* Coach Review
* Sharing

---

# 13. Design Decisions

* Backlog 採 Living Document。
* Feature 以 Epic 分組。
* MVP Scope 優先於新功能。
* AI Agent 必須遵循 Priority。
* Out of Scope 功能不得提前開發。
* 技術債僅在實際開發後才會記錄，本文件目前僅列出預期技術考量。

---

# 14. Related Documents

Depends On

* 02_PRODUCT_SPEC.md
* 17_CODING_GUIDELINES.md
* 18_DECISION_LOG.md

Related

* 20_AGENTS.md

---

# 15. Revision History

| Version | Date       | Description                                          |
| ------- | ---------- | ---------------------------------------------------- |
| 1.2     | 2026-06-26 | Replace Technical Debt with Technical Considerations |
| 1.1     | 2026-06-26 | Update Dashboard priority to P1 (MVP)                |
| 1.0     | 2026-06-26 | Initial Draft                                        |
