# 12_API_SPEC.md

# Motion Capture Platform - API Specification

---

| Item         | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Document     | 12_API_SPEC.md                                                                        |
| Version      | 1.0                                                                                   |
| Status       | Draft                                                                                 |
| Owner        | MengJu Lee                                                                            |
| Last Updated | 2026-06-26                                                                            |
| Depends On   | 02_PRODUCT_SPEC.md、06_DATA_MODEL_SPEC.md、07_STORAGE_SPEC.md、10_METRICS_ENGINE_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 API 設計。

API 的目標是支援產品功能，而非暴露內部 Engine 架構。

API 應圍繞 Domain Resources 設計：

* User
* Record
* Upload
* Annotation
* Tag
* Dashboard
* Compare

本文件不討論：

* Database Table Schema
* Frontend State Management
* Backend Folder Structure

---

# 2. API Design Principles

API 設計遵循以下原則：

* RESTful
* Resource-oriented
* Stable Boundary
* Frontend-friendly
* Engine-agnostic
* Authenticated by default

API 不應直接暴露：

* Motion Model
* Metrics Engine
* Visualization Engine
* Internal Runtime Object

---

# 3. Base URL

```text
/api
```

所有 API 均在 `/api` 底下。

---

# 4. Authentication

MVP 採用 Google OAuth。

所有 API 預設需要登入。

例外：

* Login Redirect
* OAuth Callback
* Health Check

---

# 5. Resource Overview

| Resource       | Description          |
| -------------- | -------------------- |
| `/me`          | Current User         |
| `/records`     | Motion Records       |
| `/uploads`     | Signed URL Upload    |
| `/annotations` | Viewer Annotation    |
| `/tags`        | Record Tags          |
| `/dashboard`   | Dashboard Summary    |
| `/compare`     | Side-by-side Compare |

---

# 6. User API

## Get Current User

```http
GET /api/me
```

Response：

```json
{
  "userId": "user_123",
  "displayName": "MengJu Lee",
  "email": "user@example.com",
  "avatarUrl": "https://..."
}
```

---

# 7. Record API

## List Records

```http
GET /api/records
```

Query：

```text
search
tag
sort
page
pageSize
```

Response：

```json
{
  "items": [
    {
      "recordId": "record_123",
      "title": "Squat Practice",
      "description": "Morning session",
      "thumbnailUrl": "https://signed-url",
      "duration": 12.4,
      "status": "Ready",
      "tags": ["squat", "practice"],
      "createdAt": "2026-06-26T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Get Record Detail

```http
GET /api/records/{recordId}
```

Response：

```json
{
  "recordId": "record_123",
  "title": "Squat Practice",
  "description": "Morning session",
  "status": "Ready",
  "video": {
    "url": "https://signed-video-url",
    "duration": 12.4,
    "fps": 30
  },
  "pose": {
    "url": "https://signed-pose-url",
    "version": "1.0"
  },
  "metrics": {
    "seriesUrl": "https://signed-metrics-url",
    "summary": []
  },
  "tags": ["squat"],
  "createdAt": "2026-06-26T10:00:00Z"
}
```

---

## Create Record

```http
POST /api/records
```

Request：

```json
{
  "title": "Squat Practice",
  "description": "",
  "tags": ["squat"]
}
```

Response：

```json
{
  "recordId": "record_123",
  "status": "Uploading"
}
```

---

## Update Record

```http
PATCH /api/records/{recordId}
```

Request：

```json
{
  "title": "Squat Practice - Updated",
  "description": "New description",
  "tags": ["squat", "training"]
}
```

---

## Delete Record

```http
DELETE /api/records/{recordId}
```

刪除 Record 時應同步刪除：

* Video
* Pose
* Metrics
* Thumbnail
* Annotations

---

# 8. Upload API

Upload API 用於產生 Signed URL，並在 artifact 上傳完成後保存 artifact metadata。

Canonical Upload Flow：

```text
POST /api/records
↓
Create Uploading Record
↓
Request Signed Upload URLs
↓
Upload Artifacts to GCS
↓
Complete Upload Endpoints
↓
POST /api/records/{recordId}/complete
↓
Ready or Failed
```

Record 必須在 artifact upload 前建立。Storage path 由 Backend 產生與驗證，Frontend 不自行拼接 authoritative storage path。

## Request Video Upload URL

```http
POST /api/uploads/video
```

Request：

```json
{
  "recordId": "record_123",
  "fileName": "video.webm",
  "contentType": "video/webm",
  "fileSize": 12345678
}
```

Response：

```json
{
  "uploadUrl": "https://signed-upload-url",
  "storagePath": "videos/record_123/video.webm",
  "expiresAt": "2026-06-26T10:10:00Z"
}
```

---

## Complete Video Upload

```http
POST /api/uploads/video/complete
```

Request：

```json
{
  "recordId": "record_123",
  "storagePath": "videos/record_123/video.webm"
}
```

---

## Request Pose Upload URL

```http
POST /api/uploads/pose
```

Request：

```json
{
  "recordId": "record_123",
  "contentType": "application/json"
}
```

Response：

```json
{
  "uploadUrl": "https://signed-upload-url",
  "storagePath": "poses/record_123/pose.v1.json"
}
```

---

## Complete Pose Upload

```http
POST /api/uploads/pose/complete
```

Request：

```json
{
  "recordId": "record_123",
  "storagePath": "poses/record_123/pose.v1.json",
  "version": "1.0"
}
```

---

## Request Metrics Upload URL

```http
POST /api/uploads/metrics
```

Request：

```json
{
  "recordId": "record_123",
  "contentType": "application/json"
}
```

Response：

```json
{
  "uploadUrl": "https://signed-upload-url",
  "storagePath": "metrics/record_123/metric-series.v1.json"
}
```

---

## Complete Metrics Upload

```http
POST /api/uploads/metrics/complete
```

Request：

```json
{
  "recordId": "record_123",
  "storagePath": "metrics/record_123/metric-series.v1.json",
  "version": "1.0",
  "summary": [
    {
      "metricId": "knee_flexion",
      "min": 30,
      "max": 120,
      "average": 75,
      "rangeOfMotion": 90
    }
  ]
}
```


## Request Thumbnail Upload URL

```http
POST /api/uploads/thumbnail
```

Request：

```json
{
  "recordId": "record_123",
  "contentType": "image/jpeg",
  "fileSize": 123456,
  "generatedFromFrameIndex": 0
}
```

Response：

```json
{
  "uploadUrl": "https://signed-upload-url",
  "storagePath": "thumbnails/record_123/thumbnail.jpg"
}
```

---

## Complete Thumbnail Upload

```http
POST /api/uploads/thumbnail/complete
```

Request：

```json
{
  "recordId": "record_123",
  "storagePath": "thumbnails/record_123/thumbnail.jpg",
  "generatedFromFrameIndex": 0
}
```

---

## Finalize Record

```http
POST /api/records/{recordId}/complete
```

用途：通知 Backend 檢查 required artifacts、Metric Summary 與 metadata 是否完整，並將 Record finalization 為 `Ready` 或 `Failed`。

Request：

```json
{
  "recordId": "record_123"
}
```

Response：

```json
{
  "recordId": "record_123",
  "status": "Ready"
}
```

Record 只有在 Video、Pose Dataset、Metric Series、Thumbnail、Metric Summary 與 artifact metadata 都完成後才可成為 `Ready`。

---

# 9. Annotation API

## List Annotations

```http
GET /api/records/{recordId}/annotations
```

Response：

```json
{
  "items": [
    {
      "annotationId": "annotation_123",
      "frameIndex": 42,
      "timestamp": 1.4,
      "jointName": "left_knee",
      "title": "Knee inward",
      "description": "Left knee moves inward during descent.",
      "createdAt": "2026-06-26T10:00:00Z"
    }
  ]
}
```

---

## Create Annotation

```http
POST /api/records/{recordId}/annotations
```

Request：

```json
{
  "frameIndex": 42,
  "timestamp": 1.4,
  "jointName": "left_knee",
  "title": "Knee inward",
  "description": "Left knee moves inward during descent."
}
```

---

## Update Annotation

```http
PATCH /api/annotations/{annotationId}
```

---

## Delete Annotation

```http
DELETE /api/annotations/{annotationId}
```

---

# 10. Tag API

## List Tags

```http
GET /api/tags
```

Response：

```json
{
  "items": [
    {
      "tagId": "tag_123",
      "name": "squat"
    }
  ]
}
```

---

## Create Tag

```http
POST /api/tags
```

Request：

```json
{
  "name": "squat"
}
```

---

## Delete Tag

```http
DELETE /api/tags/{tagId}
```

---

# 11. Dashboard API

## Get Dashboard Summary

```http
GET /api/dashboard/summary
```

Response：

```json
{
  "counts": {
    "totalRecords": 24,
    "readyRecords": 20,
    "failedRecords": 1,
    "recentActivityCount": 6,
    "recentActivityWindowDays": 30
  },
  "metricTrends": [
    {
      "metricId": "knee_flexion",
      "unit": "degree",
      "metricDefinitionVersion": "knee-flexion.v1",
      "activityType": "squat",
      "side": "left",
      "statistic": "average",
      "points": [
        {
          "recordId": "record_123",
          "recordTitle": "Squat Practice",
          "status": "Ready",
          "createdAt": "2026-06-26T10:00:00Z",
          "value": 75
        }
      ]
    }
  ],
  "trendAvailability": {
    "readyRecords": 20,
    "recordsWithMetricSummary": 18,
    "recordsWithCompatibleMetricSummary": 12
  }
}
```

Rules：

* The endpoint requires authentication and returns only data derived from Records owned by the current user.
* Trend points use Metric Summary only and never expose Video, Pose Dataset, Metric Series, or signed runtime URLs.
* Trend compatibility requires an exact match of `metricId`, `unit`, `metricDefinitionVersion`, `activityType`, and `side`.
* A Metric Summary item missing any compatibility field is excluded from cross-Record trends.
* Only `Ready` Records contribute trend points.
* MVP trend statistic is `average`.
* Points are ordered by `createdAt` ascending.
* `trendAvailability` is additive diagnostic metadata used to distinguish no Ready Records, no Metric Summary, and no compatible Metric Summary states.
* Availability counts are based only on owned Ready Records, count each Record at most once, and use the same compatibility contract as `metricTrends`.

---

# 12. Compare API

## Get Compare Data

```http
GET /api/compare
```

Query：

```text
recordA
recordB
```

Response：

```json
{
  "recordA": {
    "recordId": "record_123",
    "videoUrl": "https://signed-url",
    "poseUrl": "https://signed-url",
    "metricsUrl": "https://signed-url"
  },
  "recordB": {
    "recordId": "record_456",
    "videoUrl": "https://signed-url",
    "poseUrl": "https://signed-url",
    "metricsUrl": "https://signed-url"
  }
}
```

---

## Suggest Sync Point

```http
POST /api/compare/sync-suggestion
```

Request：

```json
{
  "recordA": "record_123",
  "recordB": "record_456"
}
```

Response：

```json
{
  "recordAFrame": 42,
  "recordBFrame": 39,
  "confidence": 0.82
}
```

---

# 13. Error Response

所有錯誤統一格式：

```json
{
  "error": {
    "code": "RECORD_NOT_FOUND",
    "message": "Record not found."
  }
}
```

---

# 14. Design Decisions

* API 不暴露 Motion Model。
* API 不暴露 Metrics Engine。
* API 僅暴露產品層 Resources。
* Upload 使用 Signed URL。
* Viewer / Compare 直接取得 signed file URLs。
* Annotation 僅支援 Viewer。
* Compare Annotation 屬 Future Work。

---

# 15. Related Documents

Depends On

* 02_PRODUCT_SPEC.md
* 06_DATA_MODEL_SPEC.md
* 07_STORAGE_SPEC.md
* 10_METRICS_ENGINE_SPEC.md

Related

* 13_FRONTEND_ARCHITECTURE.md
* 14_BACKEND_ARCHITECTURE.md
* 15_UI_COMPONENT_SPEC.md

---

# 16. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Upload / Finalization / Error Contract

## Canonical Record Creation Flow

```text
POST /api/records
↓
Create Record with status = Uploading
↓
Request signed upload URLs
↓
Upload artifacts to GCS
↓
Complete artifact uploads
↓
POST /api/records/{recordId}/complete
↓
Ready or Failed
```

## Create Record

```http
POST /api/records
```

Response：

```json
{
  "recordId": "record_123",
  "status": "Uploading"
}
```

## Thumbnail Upload API

### Request Thumbnail Upload URL

```http
POST /api/uploads/thumbnail
```

Request：

```json
{
  "recordId": "record_123",
  "contentType": "image/jpeg",
  "fileSize": 123456
}
```

Response：

```json
{
  "uploadUrl": "https://signed-upload-url",
  "storagePath": "thumbnails/record_123/thumbnail.jpg",
  "expiresAt": "2026-06-26T10:10:00Z"
}
```

### Complete Thumbnail Upload

```http
POST /api/uploads/thumbnail/complete
```

Request：

```json
{
  "recordId": "record_123",
  "storagePath": "thumbnails/record_123/thumbnail.jpg",
  "generatedFromFrameIndex": 0
}
```

## Metrics Complete with Summary

```http
POST /api/uploads/metrics/complete
```

Request：

```json
{
  "recordId": "record_123",
  "storagePath": "metrics/record_123/metric-series.v1.json",
  "version": "1.0",
  "summary": [
    {
      "metricId": "knee_flexion",
      "min": 30,
      "max": 120,
      "average": 75,
      "rangeOfMotion": 90
    }
  ]
}
```

Metric Series storage path points to GCS. Metric Summary is persisted in PostgreSQL.

## Record Finalization API

```http
POST /api/records/{recordId}/complete
```

Purpose：

* Validate all required artifacts are completed.
* Validate Metric Summary exists.
* Move Record to `Ready` if complete.
* Move Record to `Failed` if finalization fails.

Response：

```json
{
  "recordId": "record_123",
  "status": "Ready"
}
```

## Required Artifacts for Finalization

* Video
* Pose Dataset
* Metric Series
* Metric Summary
* Thumbnail

## Canonical Record Status

```text
Uploading
Processing
Ready
Failed
Archived(Future)
```

## Video Storage Path

Video storage path supports extension：

```text
videos/{recordId}/video.{ext}
```

MVP default Browser output may be：

```text
videos/{recordId}/video.webm
```

## Error Codes

MVP API error codes：

* UNAUTHORIZED
* FORBIDDEN
* VALIDATION_ERROR
* UPLOAD_URL_FAILED
* UPLOAD_NOT_COMPLETED
* ARTIFACT_MISSING
* RECORD_FINALIZATION_FAILED
* RECORD_NOT_FOUND
* UPLOAD_URL_FAILED
* UPLOAD_NOT_COMPLETED
* INVALID_STORAGE_PATH
* ARTIFACT_MISSING
* RECORD_FINALIZATION_FAILED

Error response format remains：

```json
{
  "error": {
    "code": "RECORD_NOT_FOUND",
    "message": "Record not found."
  }
}
```

## Compare Route Mapping

Frontend route：

```text
/compare?left=:recordId&right=:recordId
```

API route：

```text
/api/compare?recordA=:recordId&recordB=:recordId
```

Frontend maps `left/right` to API `recordA/recordB`.
