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
↓
Viewer / Compare / Dashboard
```

Pipeline 採線性設計，每個 Stage 有明確輸入與輸出。

MVP 中，Record 會在 artifact upload 前建立；Upload 失敗不代表 Record 不存在，而是該 Record 進入 `Failed` 並保存 failure metadata。

# 4. Pipeline Stages

整個 Pipeline 分為九個 Stage。

---

## Stage 1 — Camera Initialization

目的：初始化 Camera。

包含：

* Camera Permission
* Resolution
* FPS
* Device Selection

輸出：Live Video Stream。

---

## Stage 2 — Recording

使用者開始錄影。

同時：

* 寫入 Video
* 執行 Real-time Pose Detection
* 即時 Skeleton Overlay
* 即時 Joint Angle Overlay

此階段所有資料皆存在 Browser Memory。

此階段尚未建立 persisted Record。`Recording` 是 Frontend Runtime State，不是 Database / API 的 Record Status。

---

## Stage 3 — Recording Finished / Browser Analysis

使用者停止錄影後，Browser 產生 MVP 所需資料：

* Video Blob
* Pose Dataset
* Motion Model（Runtime only）
* Metric Series
* Metric Summary
* Thumbnail
* Recording Metadata

Motion Model 僅存在 Runtime，MVP 不持久化保存。

---

## Stage 4 — Create Uploading Record

Browser 在 artifact upload 前呼叫：

```http
POST /api/records
```

Backend 建立 persisted Record，初始 status 為：

```text
Uploading
```

Frontend 取得 `recordId` 後，才能用該 `recordId` request signed upload URLs。

---

## Stage 5 — Artifact Upload

Required MVP Artifacts：

* Video
* Pose Dataset
* Metric Series
* Thumbnail

上傳流程：

```text
Browser
↓
Request Signed Upload URL
↓
Upload Artifact to GCS
↓
Complete Upload Endpoint
↓
Backend Save Artifact Metadata
```

Storage path 由 Backend 產生與驗證，Frontend 不自行拼接 authoritative storage path。

若任一 required artifact upload 失敗，Record 進入 `Failed` 並保存 failure metadata。

---

## Stage 6 — Metric Summary Persistence

Metric Summary 是 structured data，存於 PostgreSQL，供 Dashboard 使用。

Metric Summary 不作為 MVP GCS artifact，不產生 `metric-summary.v1.json`。

---

## Stage 7 — Record Finalization

Backend 在以下條件都完成後，才可將 Record finalization 為 `Ready`：

* Video upload complete
* Pose Dataset upload complete
* Metric Series upload complete
* Thumbnail upload complete
* Metric Summary persisted
* Artifact metadata validated

若 finalization 失敗，Record 進入 `Failed`。

---

## Stage 8 — Ready Record Assembly

Ready Record 包含：

* Metadata
* Video metadata + signed download URL
* Pose Dataset metadata + signed download URL
* Metric Series metadata + signed download URL
* Metric Summary
* Thumbnail metadata + signed download URL
* Tags
* Annotation（初始為空集合）

---

## Stage 9 — Viewer / Compare / Dashboard Consumption

Ready Record 可供：

* Viewer：讀取 Video / Pose Dataset / Metric Series / Annotation
* Compare：讀取兩筆 Record 的 Video / Pose Dataset / Metric Series
* Dashboard：讀取 Record Metadata / Metric Summary，不重新分析影片

# 5. Runtime States

Pipeline 需明確區分 Frontend Runtime State 與 Persisted Record Status。

## Frontend Runtime State

Frontend runtime state 僅存在於 UI / browser pipeline，用於顯示流程與控制互動。

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

## Persisted Record Status

Persisted Record Status 是 Database / API contract。

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

`Recording` 不得作為 persisted Record status。`Saving` 若在 implementation 中出現，只能作為 frontend/internal transient step，不得進入 API / DB status enum。

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

* 不建立 Ready Record。
* 若 persisted Record 已建立，Record status 應更新為 `Failed`。
* 錯誤資訊需保存於 failure metadata，供 Retry、Debug 與 UI 顯示。

Failure metadata 最小欄位：

* failureStage
* failureCode
* failureMessage
* failedAt
* retryable
* retryCount

常見 failureStage：

* RECORD_CREATE
* VIDEO_UPLOAD
* POSE_UPLOAD
* METRIC_SERIES_UPLOAD
* THUMBNAIL_UPLOAD
* METRIC_SUMMARY_PERSISTENCE
* RECORD_FINALIZATION

Retry 是否允許由 `retryable` 決定。

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

