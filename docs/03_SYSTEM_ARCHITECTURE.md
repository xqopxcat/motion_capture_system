# 03_SYSTEM_ARCHITECTURE.md

# Motion Capture Platform - System Architecture

---

| Item         | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Document     | 03_SYSTEM_ARCHITECTURE.md                                      |
| Version      | 1.0                                                            |
| Status       | Draft                                                          |
| Owner        | MengJu Lee                                                     |
| Last Updated | 2026-06-26                                                     |
| Depends On   | 00_MASTER_CONTEXT.md、01_PROJECT_OVERVIEW.md、02_PRODUCT_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的整體系統架構（System Architecture）。

目的為：

* 定義系統分層（System Layers）
* 定義各模組責任（Responsibilities）
* 定義資料流（Data Flow）
* 定義各 Engine 的角色
* 建立後續 Frontend、Backend、Analysis Pipeline 的共同架構基礎

本文件不討論：

* API 設計
* Database Schema
* UI Layout
* 演算法實作

上述內容將於後續文件定義。

---

# 2. Architecture Philosophy

Motion Capture Platform 採用 **Layered Architecture**。

平台由多個獨立 Layer 所組成，每一層皆有明確責任。

任何 Layer 都應遵循：

* Single Responsibility
* Low Coupling
* High Cohesion
* Replaceable
* Testable

平台不應依賴：

* MediaPipe
* 特定運動
* 特定 Visualization

---

# 3. High-Level Architecture

```text
┌──────────────────────────────────────────┐
│              Web Application             │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│            Capture Module                │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│              Pose Engine                 │
│      (MediaPipe / Future Engines)        │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│               Pose Model                 │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│            Motion Model Engine           │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│             Metrics Engine               │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│         Visualization Engine             │
└──────────────────────────────────────────┘
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
     Viewer      Compare     Dashboard
```

---

# 4. System Layers

平台共分為六個主要 Layer。

## Layer 1 — Capture Layer

負責：

* Camera Preview
* Recording
* Browser Permissions
* Recording Control

輸出：

* Video

不負責：

* Pose Detection
* Metrics

---

## Layer 2 — Pose Layer

負責：

將 Video 轉換為 Pose。

目前採用：

* MediaPipe Pose Landmarker

未來可替換：

* MoveNet
* OpenPose
* Apple Vision
* Azure Kinect

輸出：

```text
pose.v1.json
```

Pose Layer 不應直接提供 UI。

---

## Layer 3 — Motion Model Layer

負責建立人體模型。

包含：

* Joint
* Segment
* Body Center
* Body Axis
* Coordinate System

此 Layer 為所有 Metrics 的基礎。

---

## Layer 4 — Metrics Layer

負責：

由 Motion Model 計算：

* Joint Metrics
* Segment Metrics
* Motion Metrics
* Symmetry Metrics
* Temporal Metrics

輸出：

* Metric Series
* Metric Summary

不直接依賴 UI。

---

## Layer 5 — Visualization Layer

負責：

將 Pose 與 Metrics 呈現於畫面。

包含：

* Skeleton
* Joint Labels
* Angle Labels
* Timeline
* Annotation
* Compare View

此 Layer 不負責計算任何 Metrics。

---

## Layer 6 — Application Layer

提供產品功能。

包含：

* Capture
* Viewer
* Compare
* Dashboard
* Record Management

所有功能皆建立於前五層。

---

# 5. Core Engines

平台由五個 Engine 組成。

## Pose Engine

Input：

* Video

Output：

* Pose

可替換。

---

## Motion Model Engine

Input：

* Pose

Output：

* Motion Model

負責人體抽象模型。

---

## Metrics Engine

Input：

* Motion Model

Output：

* Metrics

提供所有數值。

---

## Visualization Engine

Input：

* Pose
* Metrics
* Viewer State

Output：

* Canvas Rendering

Capture、Viewer、Compare 共用同一套 Visualization Engine。

---

## Insight Engine（Future）

Input：

* Metrics

Output：

* AI Recommendation
* Coaching
* Reports

MVP 不實作。

---

# 6. System Data Flow

整體資料流如下：

```text
Video
    │
    ▼
Pose Engine
    │
    ▼
pose.v1.json
    │
    ▼
Motion Model
    │
    ▼
Metrics Engine
    │
    ├── metric-series.v1.json
    └── metric-summary
                │
                ▼
Visualization Engine
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
  Capture    Viewer    Compare
                         │
                         ▼
                     Dashboard
```

所有 Layer 皆為單向依賴，不允許反向依賴。

---

# 7. Frontend Responsibilities

Frontend 負責：

* Camera
* Recording
* Pose Detection（MVP）
* Visualization
* Viewer
* Compare
* Dashboard
* Annotation

Frontend 不負責：

* Metadata Persistence
* Authentication
* Storage Management

---

# 8. Backend Responsibilities

Backend 負責：

* Authentication
* Record Metadata
* Signed URL
* File Management
* REST API

Backend 不直接執行：

* Pose Detection（MVP）
* Metrics Calculation（MVP）
* Visualization

未來可視需求將 Analysis Pipeline 移至 Backend。

---

# 9. Storage Architecture

Structured Data：

* PostgreSQL

Large Files：

* Google Cloud Storage

儲存內容：

* Video
* Pose JSON
* Metric Series JSON
* Thumbnail

Backend 僅保存 Metadata。

---

# 10. Design Principles

所有 Architecture 均遵循：

## Engine Agnostic

任何 Engine 都可替換。

---

## Modular

每個 Layer 可獨立開發。

---

## Stateless Processing

Visualization 不保存資料。

Metrics 不修改 Pose。

Motion Model 不修改 Pose。

---

## Single Source of Truth

每一層都有唯一輸出：

* Pose → pose.v1.json
* Metrics → metric-series.v1.json
* Metadata → PostgreSQL

---

# 11. Future Evolution

未來可加入：

* AI Coach
* Overlay Compare
* Multi-person Tracking
* 3D Visualization
* Wearable Integration
* IMU Fusion
* Force Plate
* EMG

上述功能皆建立於既有 Architecture，不需推翻核心設計。

---

# 12. Related Documents

Depends On

* 00_MASTER_CONTEXT.md
* 01_PROJECT_OVERVIEW.md
* 02_PRODUCT_SPEC.md

Related

* 04_ANALYSIS_PIPELINE_SPEC.md
* 06_DATA_MODEL_SPEC.md
* 10_METRICS_ENGINE_SPEC.md
* 11_VISUALIZATION_ENGINE_SPEC.md
* 13_FRONTEND_ARCHITECTURE.md
* 14_BACKEND_ARCHITECTURE.md

---

# 13. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Patch 1 Addendum — Terminology and Boundary Alignment

Status: Patch 1 Applied  
Source: SPEC_PATCH_PLAN_01_CRITICAL_ITEMS.md

本節補齊跨文件的最小命名與責任邊界，避免 Implementation 時產生 SSOT ambiguity。

## Canonical Domain Terms

| Concept | Canonical Term | Notes |
| --- | --- | --- |
| Persisted capture session | Record | `Motion Record` 可作為說明用語，但正式 Domain Object 使用 `Record`。 |
| Raw pose artifact | Pose Dataset | 不使用 `Pose Model` 作為 artifact 名稱。 |
| Pose file | pose.v1.json | Storage file naming。 |
| Per-frame metrics | Metric Series | 存於 GCS。 |
| Aggregated metrics | Metric Summary | 存於 PostgreSQL。 |

## Runtime State vs Persisted Status

Frontend runtime state 不等於 persisted Record status。

```text
Frontend Runtime State:
Idle / Recording / Analyzing / Uploading / Completed / Failed

Persisted Record Status:
Uploading / Processing / Ready / Failed / Archived(Future)
```

`Recording` 不作為 Database persisted status。

## Visualization Boundary

Capture、Viewer、Compare 共用 Visualization Engine。

Visualization Engine 負責 render overlay / skeleton / metric labels / annotation anchors。

Playback、video element、frame ownership、compare sync orchestration 屬於 Application / Feature layer，不屬於 Visualization Engine。

