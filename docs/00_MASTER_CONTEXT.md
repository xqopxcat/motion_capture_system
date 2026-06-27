# 00_MASTER_CONTEXT.md

# Motion Capture Platform - Master Context

Version: 1.0

Status: Approved (Living Document)

Owner: MengJu Lee

---

# 1. Purpose

本文件是 Motion Capture Platform 專案的 **Master Context**。

*目的不是定義功能，而是提供所有設計文件、AI Agent（ChatGPT、Codex）與未來開發者共同遵循的背景知識與核心設計理念。*

任何新的 Design Doc、Implementation、Code Review、Architecture Discussion，都應先閱讀本文件。

本文件是整個專案的 **Single Source of Truth (SSOT)**。

---

# 2. Project Vision

本產品是一套 **Web-first Motion Capture Platform**。

使用者只需要：

* 一支手機
* 一台電腦
* 一個瀏覽器

即可完成：

* Motion Capture
* Motion Analysis
* Motion Comparison
* Progress Tracking

平台定位：

> 通用 Motion Capture Platform，而非單一運動分析工具。

平台不綁定：

* 深蹲
* 跑步
* 滑雪
* 高爾夫
* 棒球
* 復健

所有運動分析皆建立於同一套平台架構。

---

# 3. Product Philosophy

本產品不只是 AI Pose Detection。

產品定位為：

Video

↓

Pose

↓

Motion Model

↓

Metrics

↓

Visualization

↓

Insight（Future）

而不是：

Video

↓

MediaPipe

↓

Viewer

MediaPipe 僅是其中一種 Pose Engine。

未來可替換：

* MoveNet
* OpenPose
* Apple Vision
* Azure Kinect
* Vicon
* IMU Fusion

而不需修改平台核心架構。

---

# 4. Core Design Principles

平台遵循以下原則：

1. Engine Agnostic
2. Motion Agnostic
3. Sport Agnostic
4. Extensible
5. Modular
6. Versionable
7. Web-first
8. Production Ready

避免所有與特定 AI Engine 或特定運動高度耦合的設計。

---

# 5. Product Scope

MVP 包含：

* Google Login
* Browser Camera Capture
* Real-time Pose Detection
* Skeleton Overlay
* Real-time Joint Angle Display
* Video Upload
* Pose Upload
* Metrics Upload
* Record Management
* Motion Viewer
* Side-by-side Compare
* Annotation System
* Dashboard

MVP 不包含：

* AI Coach
* Injury Diagnosis
* Medical Recommendation
* Overlay Compare
* Multi-camera
* Native Mobile App
* Organization Workspace

---

# 6. Technical Architecture

Browser

↓

Video Capture

↓

Pose Engine

↓

Pose

↓

Motion Model

↓

Metrics Engine

↓

Visualization Engine

↓

Viewer / Compare / Dashboard

Backend：

* Authentication
* Metadata
* Signed URL
* Storage
* API

不負責：

* Pose Detection
* Skeleton Rendering
* Metrics Calculation（MVP）

---

# 7. Core Engines

平台由五個 Engine 組成。

## Pose Engine

負責：

Video

↓

Pose

目前：

MediaPipe Pose Landmarker

未來可替換。

---

## Motion Model

負責：

Pose

↓

Body Segments

↓

Body Axes

↓

Coordinate System

↓

Biomechanics Model

所有 Metrics 都建立於此。

---

## Metrics Engine

負責：

Motion Model

↓

Joint Metrics

↓

Segment Metrics

↓

Temporal Metrics

↓

Symmetry Metrics

↓

Metric Series

不直接依賴 Pose。

---

## Visualization Engine

負責：

Pose

*

Metrics

↓

Skeleton

↓

Joint Labels

↓

Timeline

↓

Viewer

↓

Compare

↓

Dashboard

所有畫面共用同一 Visualization Engine。

---

## Insight Engine（Future）

負責：

Metrics

↓

AI Coach

↓

Recommendation

↓

Report

MVP 不實作。

---

# 8. Storage Strategy

Structured Data：

PostgreSQL

Large Files：

Google Cloud Storage

所有大型檔案：

* Video
* Pose JSON
* Metric Series JSON
* Thumbnail
* Report

皆透過 Signed URL 上傳。

MVP 即採用 Signed URL，不使用直接 Upload API。

---

# 9. Pose Storage Policy

平台正式名稱：

pose.v1.json

不是：

landmarks.v1.json

Storage Layer 永遠保留：

MediaPipe 33 Joint。

不要於 Storage Layer 刪除：

* Face
* Hand
* Foot

Rendering Layer 自行決定：

Display Skeleton。

Metrics Engine 自行決定：

使用哪些 Joint。

---

# 10. Motion Model Philosophy

Motion Model 是平台核心。

Metrics 永遠建立於：

Pose

↓

Motion Model

↓

Metrics

而不是：

Pose

↓

Metrics

Motion Model 定義：

* Joint
* Segment
* Body Center
* Body Axis
* Coordinate System
* Symmetry

---

# 11. Visualization Philosophy

Visualization Engine 不負責：

計算。

只負責：

呈現。

所有數值皆來自：

Metrics。

所有座標皆來自：

Pose。

Capture

Viewer

Compare

Dashboard

共用同一 Visualization Engine。

---

# 12. Compare Philosophy

Compare V1：

採用：

Side-by-side。

原因：

不同錄影：

* 距離
* 視角
* 比例
* 時間

Overlay 容易造成誤判。

Compare 在 MVP 階段即採用：

Semi Auto Sync。

系統負責：

建議 Sync Point。

使用者負責：

確認與微調。

未來：

可加入：

Overlay Mode。

---

# 13. Annotation Philosophy

Annotation 為 Viewer 功能。

Compare 不支援 Annotation。

Annotation：

建立於：

Timeline。

包含：

* Marker
* Drawer
* Frame Jump
* Joint Highlight

Annotation 不直接畫文字於畫面。

---

# 14. Dashboard Philosophy

Dashboard 不只是資料列表。

目的是：

讓使用者了解：

自己的變化。

包含：

* Progress
* Trend
* Session History
* ROM Trend
* Symmetry Trend

Dashboard 不重新分析影片。

只使用 Summary Data。

---

# 15. Technical Stack

Frontend：

* React
* JavaScript
* Redux Toolkit
* RTK Query
* React Router

Backend：

* FastAPI

Database：

* PostgreSQL

Storage：

* Google Cloud Storage

Authentication：

* Google OAuth

Pose：

* MediaPipe Pose Landmarker

Deployment：

* Docker

---

# 16. Naming Conventions

使用：

Pose

不用：

Landmark。

使用：

Visualization Engine

不用：

Rendering Engine。

使用：

Joint

不用：

Landmark Object。

所有命名皆以 Domain Model 為主，而非 AI Engine。

---

# 17. Design Philosophy

本專案不以 Demo 為目標。

而是：

可持續演進的 Motion Analysis Platform。

所有 Architecture 都應考慮：

* 可維護性
* 可擴充性
* Versioning
* Long-term Evolution

避免為 MVP 過度犧牲 Architecture。

---

# 18. Development Workflow

所有開發皆遵循：

Design

↓

Review

↓

Approve

↓

Codex Sprint

↓

Implementation

↓

Code Review

↓

Refactor

先完成 Design Docs。

再開始實作。

---

# 19. Document Hierarchy

所有文件依序閱讀：

00_MASTER_CONTEXT.md

↓

01_PROJECT_OVERVIEW.md

↓

02_PRODUCT_SPEC.md

↓

03_SYSTEM_ARCHITECTURE.md

↓

...

Master Context 永遠為最高層級文件。

若其他文件與 Master Context 衝突，以 Master Context 為準。

---

# 20. Long-term Goal

本專案希望建立的是：

一套完整的 Motion Capture Platform。

未來可擴充：

* AI Coach
* Sport-specific Modules
* Coach Workspace
* Organization
* Report System
* 3D Visualization
* Wearable Integration
* IMU
* Force Plate
* EMG

平台核心 Architecture 不因新增功能而改變，只新增新的 Engine、Metrics 或 Module。

---

# 21. Guiding Principle

任何設計決策都應先問：

> 這是為了 MediaPipe 而設計，還是為了 Motion Capture Platform 而設計？

若答案偏向前者，應重新思考是否過度耦合。

平台的核心永遠是：

**Pose → Motion Model → Metrics → Visualization → Insight**

而不是任何單一 AI Engine 或單一運動項目。
