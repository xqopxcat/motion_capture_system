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

Upload API 用於產生 Signed URL。

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
  "version": "1.0"
}
```

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
  "totalRecords": 24,
  "recentRecords": [],
  "metricTrends": []
}
```

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
