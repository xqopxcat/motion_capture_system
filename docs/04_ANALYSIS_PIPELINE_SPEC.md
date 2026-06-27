# 04_ANALYSIS_PIPELINE_SPEC.md

# Motion Capture Platform - Analysis Pipeline Specification

---

| Item         | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| Document     | 04_ANALYSIS_PIPELINE_SPEC.md                                      |
| Version      | 1.0                                                               |
| Status       | Draft                                                             |
| Owner        | MengJu Lee                                                        |
| Last Updated | 2026-06-26                                                        |
| Depends On   | 00_MASTER_CONTEXT.md、02_PRODUCT_SPEC.md、03_SYSTEM_ARCHITECTURE.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 **Analysis Pipeline**。

Analysis Pipeline 描述的是：

> 一筆 Motion Record 從開始錄影，到最後可以於 Viewer、Compare 與 Dashboard 使用，中間所經過的所有資料處理流程。

本文件聚焦於：

* Processing Flow
* Data Flow
* Pipeline Stage
* Sync / Async Boundary
* Storage Timing

不討論：

* UI Layout
* API Endpoint
* Database Schema

---

# 2. Design Goals

Analysis Pipeline 應符合以下原則：

* Pipeline 可重複執行
* 每個 Stage 單一職責
* 各 Stage 可獨立測試
* Pipeline 可中斷後恢復
* 可替換 Pose Engine
* 可擴充新的 Metrics Engine
* 可移轉至 Backend Processing

---

# 3. High-Level Pipeline

```text
Camera

↓

Recording

↓

Video Buffer

↓

Recording Finished

↓

Video Upload

↓

Pose Analysis

↓

Motion Model Generation

↓

Metrics Calculation

↓

Record Assembly

↓

Storage

↓

Viewer / Compare / Dashboard
```

Pipeline 採線性設計，每個 Stage 有明確輸入與輸出。

---

# 4. Pipeline Stages

整個 Pipeline 分為九個 Stage。

---

## Stage 1 — Camera Initialization

目的：

初始化 Camera。

包含：

* Camera Permission
* Resolution
* FPS
* Device Selection

輸出：

Live Video Stream。

---

## Stage 2 — Recording

使用者開始錄影。

同時：

* 寫入 Video
* 執行 Real-time Pose Detection
* 即時 Skeleton Overlay
* 即時 Joint Angle Overlay

此階段所有資料皆存在 Browser Memory。

尚未建立 persisted Record；Record 會在 Recording Finished 後、artifact upload 前建立。

---

## Stage 3 — Recording Finished

使用者停止錄影。

產生：

* Video Blob
* Pose Frames
* Recording Metadata

Pipeline 正式開始。

---

## Stage 4 — Video Upload

Video 上傳流程：

Browser

↓

Request Signed URL

↓

Upload Video

↓

Receive Storage Path

輸出：

video_path

若 Upload 失敗：

Pipeline 中止。

Record 進入 Failed，並保存 failure metadata。

---

## Stage 5 — Pose Processing

Pose Engine 產生：

```text
pose.v1.json
```

內容包含：

每一 Frame：

* Timestamp
* 2D Pose
* 3D Pose
* Visibility

輸出：

Pose Dataset。

---

## Stage 6 — Motion Model Generation

Pose Dataset

↓

Motion Model

建立：

* Joint
* Segment
* Body Center
* Body Axis
* Coordinate System

Motion Model 不修改 Raw Pose。

僅建立抽象模型。

---

## Stage 7 — Metrics Calculation

Motion Model

↓

Metrics Engine

計算：

* Joint Angles
* Segment Angles
* Range of Motion
* Angular Velocity
* Symmetry
* Center of Mass（Future）
* Balance（Future）

輸出：

metric-series.v1.json

以及：

metric-summary。

---

## Stage 8 — Record Assembly

系統建立完整 Motion Record。

Record 包含：

Metadata

*

Video

*

Pose

*

Metrics

*

Thumbnail

*

Tags

*

Annotation（空集合）

Record Record 會先以 Uploading status 建立；artifact metadata 與 Metric Summary 完成後再 finalization 為 Ready。

---

## Stage 9 — Persistence

建立：

Record Metadata。

並保存：

PostgreSQL

↓

Record

Google Cloud Storage

↓

Video

↓

Pose JSON

↓

Metric Series

↓

Thumbnail

成功後：

Record Status

↓

Ready。

---

# 5. Runtime States

Record 在 Pipeline 中共有以下狀態：

```text
Recording

↓

Uploading

↓

Processing

↓

Saving

↓

Ready
```

若失敗：

```text
Failed
```

可提供 Retry。

---

# 6. Synchronous vs Asynchronous

## Synchronous

* Camera
* Recording
* Skeleton Overlay
* Joint Angle Overlay

需維持即時回應。

---

## Asynchronous

* Upload
* Pose Serialization
* Metrics Serialization
* Thumbnail Generation
* Database Persistence

避免阻塞 UI。

---

# 7. Data Artifacts

Pipeline 會產生以下 Artifact。

## Video

用途：

原始錄影。

Storage：

Google Cloud Storage。

---

## Pose Dataset

用途：

Raw Pose。

Storage：

pose.v1.json

---

## Motion Model

用途：

Runtime。

MVP 不保存。

Future 可考慮 Cache。

---

## Metric Series

用途：

Viewer

Compare。

Storage：

metric-series.v1.json

---

## Metric Summary

用途：

Dashboard。

Storage：

Database。

---

## Thumbnail

用途：

Record List。

Storage：

Google Cloud Storage。

---

# 8. Failure Handling

若任一 Stage 發生錯誤：

應停止 Pipeline。

不建立：

Ready Record。

錯誤需保存：

* Stage
* Error Code
* Timestamp

便於 Retry 與 Debug。

---

# 9. Pipeline Extensibility

Pipeline 應允許新增：

* 新 Pose Engine
* 新 Motion Model
* 新 Metrics Engine
* AI Coach
* Heatmap Generator
* Report Generator

新增 Stage 不應影響既有 Stage。

---

# 10. MVP vs Future

## MVP

Pipeline 全部執行於 Browser。

Backend：

僅保存 Metadata。

---

## Future

可改為：

```text
Video Upload

↓

Backend Queue

↓

Pose Analysis

↓

Metrics

↓

Storage

↓

Notification
```

使大型影片分析可於雲端完成。

Architecture 無須修改。

---

# 11. Design Decisions

本專案採用以下設計決策：

* Raw Pose 永遠保留
* Motion Model 不保存（MVP）
* Metrics 為可重建資料
* Summary 與 Series 分開保存
* Viewer 與 Compare 共用同一份 Metrics
* Dashboard 僅依賴 Summary，不重新分析影片

---

# 12. Related Documents

Depends On

* 00_MASTER_CONTEXT.md
* 02_PRODUCT_SPEC.md
* 03_SYSTEM_ARCHITECTURE.md

Related

* 05_TECH_STACK_SPEC.md
* 06_DATA_MODEL_SPEC.md
* 07_STORAGE_SPEC.md
* 08_POSE_SCHEMA_SPEC.md
* 09_MOTION_MODEL_SPEC.md
* 10_METRICS_ENGINE_SPEC.md
* 11_API_SPEC.md

---

# 13. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Patch 1 Addendum — Canonical Record / Upload / Artifact Lifecycle

Status: Patch 1 Applied  
Source: SPEC_PATCH_PLAN_01_CRITICAL_ITEMS.md

本節為 Analysis Pipeline 在 MVP 的 canonical flow。若本文前面章節存在較舊的描述，以本節為準。

## Canonical MVP Pipeline

```text
Camera
↓
Recording
↓
Recording Finished
↓
Browser Analysis
↓
Create Uploading Record
↓
Request Signed Upload URLs
↓
Upload Required Artifacts
↓
Complete Artifact Uploads
↓
Persist Artifact Metadata + Metric Summary
↓
Finalize Record
↓
Ready or Failed
```

## Record Creation Timing

Record 必須在 artifact upload 前建立。

```text
Recording Finished
↓
POST /api/records
↓
Backend creates Record with status = Uploading
↓
Frontend receives recordId
↓
Frontend requests signed upload URLs using recordId
```

因此，Upload 失敗時不再定義為「Record 不建立」。Upload 失敗時，Record 應進入 `Failed`，並保存 failure metadata。

## Required MVP Artifacts

MVP Record Ready 前必須具備：

* Video
* Pose Dataset
* Metric Series
* Metric Summary
* Thumbnail

## Persisted Record Status

```text
Uploading
↓
Processing
↓
Ready
```

Failure path：

```text
Failed
```

Future：

```text
Archived
```

`Recording` 屬於 Frontend runtime state，不是 persisted Record status。

## Frontend Runtime State

```text
Idle
↓
Recording
↓
Analyzing
↓
CreatingRecord
↓
Uploading
↓
Finalizing
↓
Completed
```

Failure path：

```text
Failed
```

## Metric Summary Persistence

Metric Series 存於 GCS：

```text
metrics/{recordId}/metric-series.v1.json
```

Metric Summary 存於 PostgreSQL，供 Dashboard 使用。

## Thumbnail Generation

MVP 中 Thumbnail 由 Frontend 從影片指定 frame 產生並透過 Signed URL 上傳。

## Failure Metadata

Pipeline failure 必須保存最小資訊：

* failureStage
* failureCode
* failureMessage
* failedAt
* retryable
* retryCount

## Finalization Rule

Record 只有在以下條件都完成後才可成為 `Ready`：

* Video upload complete
* Pose Dataset upload complete
* Metric Series upload complete
* Thumbnail upload complete
* Metric Summary persisted
* Backend artifact metadata validated

