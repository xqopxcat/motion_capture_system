# 06_DATA_MODEL_SPEC.md

# Motion Capture Platform - Data Model Specification

---

| Item         | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Document     | 06_DATA_MODEL_SPEC.md                                                       |
| Version      | 1.0                                                                         |
| Status       | Draft                                                                       |
| Owner        | MengJu Lee                                                                  |
| Last Updated | 2026-06-26                                                                  |
| Depends On   | 00_MASTER_CONTEXT.md、03_SYSTEM_ARCHITECTURE.md、04_ANALYSIS_PIPELINE_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 Domain Data Model。

Data Model 用於描述系統中的核心資料物件（Domain Objects）、彼此關聯以及生命週期。

本文件不討論：

* Database Schema（下一份文件）
* API Request / Response
* JSON 格式
* UI State

---

# 2. Design Principles

所有 Data Model 應遵循：

* Single Responsibility
* Immutable Raw Data
* Extensible
* Versionable
* Engine Agnostic
* Sport Agnostic

Raw Pose 永遠不可修改。

Metrics 永遠可重新計算。

---

# 3. Core Domain Model

平台包含以下主要 Entity：

```text
User
 │
 └──── Record
         │
         ├──── Video
         ├──── Pose
         ├──── Metrics
         ├──── Annotation
         ├──── Tags
         └──── Thumbnail
```

Dashboard 則建立於 Record Summary。

---

# 4. User

代表登入平台的使用者。

主要屬性：

* userId
* displayName
* email
* avatarUrl
* createdAt
* updatedAt

一位 User 可擁有多筆 Record。

---

# 5. Record

Record 為平台最重要的 Domain Entity。

一筆 Record 代表一次完整 Motion Capture Session。

包含：

* Metadata
* Video
* Pose
* Metrics
* Annotation
* Tags
* Thumbnail

Record 不保存 Runtime State。

---

## Record Metadata

Metadata 建議包含：

* recordId
* userId
* title
* description
* capturedAt
* duration
* fps
* frameCount
* status
* createdAt
* updatedAt

---

# 6. Video

代表原始錄影。

屬性：

* videoId
* storagePath
* format
* resolution
* duration
* fileSize

Video 永遠保留。

未來可重新分析。

---

# 7. Pose

Pose 為 Raw Pose Dataset。

保存：

* pose.v1.json

內容：

* Frame
* Timestamp
* Landmarks 2D
* Landmarks 3D
* Visibility

Pose 不保存：

* Joint Angle
* Metrics

---

# 8. Metrics

Metrics 為 Pose 經 Motion Model 計算後產生。

分為：

## Metric Series

逐 Frame Metrics。

例如：

* Knee Flexion
* Hip Flexion
* Trunk Angle

Viewer 與 Compare 使用。

---

## Metric Summary

整段 Motion 的摘要。

例如：

* Max Angle
* Min Angle
* Average
* ROM

Dashboard 使用。

---

# 9. Annotation

Annotation 屬於單一 Record。

包含：

* annotationId
* frameIndex
* title
* description
* selectedJoint（Optional）
* createdAt
* updatedAt

Annotation 可：

* 新增
* 編輯
* 刪除
* 跳轉至對應 Frame

Compare 不支援 Annotation。

---

# 10. Tag

Tag 用於 Record 分類。

例如：

* Squat
* Snowboard
* Practice
* Lesson

Tag 不限制運動種類。

由使用者自由建立。

---

# 11. Thumbnail

Thumbnail 用於：

* Record List
* Dashboard

來源：

影片指定 Frame。

不重新渲染 Skeleton。

---

# 12. Relationships

```text
User
 └── Record (1:N)

Record
 ├── Video (1:1)
 ├── Pose (1:1)
 ├── Metrics (1:1)
 ├── Thumbnail (1:1)
 ├── Annotation (1:N)
 └── Tag (N:M)
```

---

# 13. Record Lifecycle

```text
Recording

↓

Uploading

↓

Processing

↓

Ready

↓

Archived（Future）
```

若 Pipeline 失敗：

```text
Failed
```

---

# 14. Versioning Strategy

大型資料皆採 Version。

例如：

```text
pose.v1.json

metric-series.v1.json

metric-summary.v1.json
```

未來若格式變更：

新增：

```text
pose.v2.json
```

而非覆蓋舊格式。

---

# 15. Design Decisions

* Record 為平台核心 Aggregate Root。
* Raw Pose 永遠保留。
* Metrics 為可重建資料。
* Annotation 屬於 Record。
* Dashboard 僅使用 Metric Summary。
* Tag 不限制類型。
* Thumbnail 為獨立 Artifact。

---

# 16. Related Documents

Depends On

* 00_MASTER_CONTEXT.md
* 03_SYSTEM_ARCHITECTURE.md
* 04_ANALYSIS_PIPELINE_SPEC.md

Related

* 07_STORAGE_SPEC.md
* 08_POSE_SCHEMA_SPEC.md
* 09_MOTION_MODEL_SPEC.md
* 10_METRICS_ENGINE_SPEC.md
* 12_API_SPEC.md

---

# 17. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Patch 1 Addendum — Implementation-Ready Domain Contract

Status: Patch 1 Applied  
Source: SPEC_PATCH_PLAN_01_CRITICAL_ITEMS.md

本節定義 MVP implementation-ready data contract。若本文前面章節存在較舊或不完整描述，以本節為準。

## Record Aggregate

Record 是 persisted aggregate root。

Record 在 artifact upload 前建立，初始 persisted status 為：

```text
Uploading
```

Record owns artifact metadata，但不保存大型檔案內容。

## Canonical Record Status

```text
Uploading
Processing
Ready
Failed
Archived(Future)
```

`Recording` 為 Frontend runtime state，不是 persisted Record status。

`Saving` 若出現，僅可作為 runtime/internal step，不作為 persisted status。

## Required MVP Artifacts

每筆 Ready Record 必須具備：

* Video
* Pose Dataset
* Metric Series
* Metric Summary
* Thumbnail

## Artifact Metadata Minimum Fields

### Video

* storagePath
* contentType
* fileSize
* duration
* fps
* frameCount
* format
* resolution（Optional）

### Pose Dataset

* storagePath
* version
* poseEngine
* poseEngineVersion
* frameCount
* fps
* duration
* generatedAt

### Metric Series

* storagePath
* version
* generatedAt

### Metric Summary

Metric Summary 存於 PostgreSQL。

最小欄位：

* metricId
* min
* max
* average
* rangeOfMotion

### Thumbnail

* storagePath
* contentType
* fileSize
* generatedFromFrameIndex

## Metric Storage Contract

```text
Metric Series → Google Cloud Storage
Metric Summary → PostgreSQL
```

`metric-summary.v1.json` 不屬於 MVP storage contract。若未來需要輸出 summary file，應作為 Future extension 另行定義。

## Failure Metadata

Failed Record 應保存：

* failureStage
* failureCode
* failureMessage
* failedAt
* retryCount
* retryable

