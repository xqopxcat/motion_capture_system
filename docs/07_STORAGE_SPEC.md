# 07_STORAGE_SPEC.md

# Motion Capture Platform - Storage Specification

---

| Item         | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Document     | 07_STORAGE_SPEC.md                                                           |
| Version      | 1.0                                                                          |
| Status       | Draft                                                                        |
| Owner        | MengJu Lee                                                                   |
| Last Updated | 2026-06-26                                                                   |
| Depends On   | 03_SYSTEM_ARCHITECTURE.md、04_ANALYSIS_PIPELINE_SPEC.md、06_DATA_MODEL_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 Storage Architecture。

Storage 並非單指 Database，而是整個平台所有資料的儲存策略。

目的包括：

* 定義各類資料存放位置
* 建立 Storage 分層
* 建立 Versioning Strategy
* 定義 Upload 與 Download 流程
* 作為 Backend API 與 Infrastructure 的依據

本文件不討論：

* Database Table Schema
* API Endpoint
* JSON Schema

---

# 2. Storage Principles

Storage 設計遵循以下原則：

* Raw Data 永遠保留
* Large File 與 Metadata 分離
* Versionable
* Immutable
* Cost Efficient
* Cloud Native
* Engine Agnostic

任何 Analysis 都應建立於 Raw Data，而非覆蓋 Raw Data。

---

# 3. Storage Layers

平台資料分為三個 Storage Layer。

## Layer 1 — Runtime

存在 Browser Memory。

生命週期：

僅於執行期間存在。

包含：

* Camera Stream
* Live Pose
* Viewer State
* Compare State

Browser 關閉即消失。

---

## Layer 2 — Structured Storage

採用：

PostgreSQL

保存：

* User
* Record Metadata
* Annotation
* Tags
* Metric Summary

主要提供：

* Search
* Filter
* Dashboard
* Record List

---

## Layer 3 — Object Storage

採用：

Google Cloud Storage

保存：

* Video
* pose.v1.json
* metric-series.v1.json
* Thumbnail

所有大型檔案皆存放於 Object Storage。

---

# 4. Storage Classification

| Data            | Storage              |
| --------------- | -------------------- |
| User            | PostgreSQL           |
| Record Metadata | PostgreSQL           |
| Annotation      | PostgreSQL           |
| Tags            | PostgreSQL           |
| Metric Summary  | PostgreSQL           |
| Video           | Google Cloud Storage |
| Pose Dataset    | Google Cloud Storage |
| Metric Series   | Google Cloud Storage |
| Thumbnail       | Google Cloud Storage |

---

# 5. Object Naming Convention

所有 Object 採固定命名。

```text
videos/{recordId}/video.mp4

poses/{recordId}/pose.v1.json

metrics/{recordId}/metric-series.v1.json

thumbnails/{recordId}/thumbnail.jpg
```

未來版本：

```text
pose.v2.json

metric-series.v2.json
```

不得覆蓋既有版本。

---

# 6. Upload Strategy

所有大型檔案皆採：

Signed URL Upload。

流程：

```text
Browser

↓

Request Signed URL

↓

Upload to GCS

↓

Notify Backend

↓

Backend Save Metadata
```

Backend 不負責檔案串流。

---

# 7. Download Strategy

Viewer 開啟 Record：

```text
Frontend

↓

Request Metadata

↓

取得 Signed URL

↓

直接下載 Video / Pose / Metrics

↓

Browser Analysis
```

Backend 僅提供 Metadata 與 Signed URL。

---

# 8. Versioning Strategy

所有大型資料皆採 Version。

例如：

```text
pose.v1.json

metric-series.v1.json
```

格式升級：

新增：

```text
pose.v2.json
```

不得修改：

```text
pose.v1.json
```

Version 由 Backend Metadata 管理。

---

# 9. Runtime Cache

Runtime 可快取：

* Current Video
* Current Pose
* Current Metrics

快取目的：

* Viewer 切換 Frame
* Compare 同步播放
* Timeline 拖曳

Browser 關閉後不保存。

---

# 10. Storage Lifecycle

Record 建立後：

```text
Recording

↓

Uploading

↓

Processing

↓

Ready
```

Ready 後：

* Video 永久保存
* Pose 永久保存
* Metrics 永久保存
* Thumbnail 永久保存

除非使用者主動刪除。

---

# 11. Delete Policy

刪除 Record 時：

同步刪除：

* Metadata
* Video
* Pose
* Metrics
* Thumbnail
* Annotation
* Tags

避免產生孤兒資料（Orphan Data）。

---

# 12. Security

Storage 必須：

* Private Bucket
* Signed URL 存取
* User Ownership 驗證
* Backend Authorization

不得直接公開 GCS Object。

---

# 13. Future Extensions

未來可加入：

* CDN
* Archive Storage
* Cold Storage
* Object Compression
* Background Cleanup Job

上述皆不影響 Storage Architecture。

---

# 14. Design Decisions

* PostgreSQL 僅保存 Structured Data。
* Object Storage 保存 Large Files。
* Raw Pose 永遠保留。
* Metrics 為可重建資料。
* Summary 與 Series 分離保存。
* Upload 採 Signed URL。
* Object 採 Immutable Versioning。

---

# 15. Related Documents

Depends On

* 03_SYSTEM_ARCHITECTURE.md
* 04_ANALYSIS_PIPELINE_SPEC.md
* 06_DATA_MODEL_SPEC.md

Related

* 08_POSE_SCHEMA_SPEC.md
* 09_MOTION_MODEL_SPEC.md
* 11_API_SPEC.md
* 14_BACKEND_ARCHITECTURE.md

---

# 16. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |
