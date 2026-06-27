# 14_BACKEND_ARCHITECTURE.md

# Motion Capture Platform - Backend Architecture Specification

---

| Item         | Value                                                   |
| ------------ | ------------------------------------------------------- |
| Document     | 14_BACKEND_ARCHITECTURE.md                              |
| Version      | 1.0                                                     |
| Status       | Draft                                                   |
| Owner        | MengJu Lee                                              |
| Last Updated | 2026-06-26                                              |
| Depends On   | 05_TECH_STACK_SPEC.md、07_STORAGE_SPEC.md、12_API_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 Backend Architecture。

Backend 的主要責任是支援產品層 Resource、資料持久化、安全性與檔案儲存流程，而不是執行 Motion Analysis。

Backend 不應暴露內部 Engine，例如：

* Motion Model
* Metrics Engine
* Visualization Engine

Backend API 應以產品 Domain Resource 為邊界，例如：

* User
* Record
* Upload
* Annotation
* Tag
* Dashboard
* Compare

---

# 2. Backend Responsibilities

Backend 負責：

* Authentication
* Authorization
* User Management
* Record Metadata
* Upload Signed URL
* Storage Metadata
* Annotation CRUD
* Tag CRUD
* Dashboard Summary
* Compare Data Preparation

Backend 在 MVP 不負責：

* Pose Detection
* Motion Model Generation
* Metrics Calculation
* Visualization Rendering

上述分析流程在 MVP 階段主要於 Browser 端執行。

---

# 3. Technology Stack

Backend 採用：

* FastAPI
* Python
* PostgreSQL
* Google Cloud Storage
* Google OAuth
* Docker

---

# 4. High-Level Backend Architecture

```text
FastAPI Application

├── API Routers
├── Services
├── Repositories
├── Schemas
├── Models
├── Auth
├── Storage
└── Core Config
```

Backend 採分層架構：

```text
Router
  ↓
Service
  ↓
Repository
  ↓
Database / Storage
```

---

# 5. Recommended Folder Structure

```text
backend/

└── app/

    ├── main.py

    ├── core/

    │   ├── config.py
    │   ├── security.py
    │   └── errors.py

    ├── api/

    │   ├── deps.py
    │   └── v1/

    │       ├── router.py
    │       ├── auth.py
    │       ├── users.py
    │       ├── records.py
    │       ├── uploads.py
    │       ├── annotations.py
    │       ├── tags.py
    │       ├── dashboard.py
    │       └── compare.py

    ├── models/

    ├── schemas/

    ├── services/

    ├── repositories/

    ├── storage/

    ├── db/

    └── tests/
```

---

# 6. API Layer

API Layer 負責：

* HTTP Request / Response
* Auth Dependency
* Request Validation
* Response Serialization
* Error Mapping

API Layer 不應包含：

* Business Logic
* SQL Query
* Storage SDK 直接操作

---

# 7. Service Layer

Service Layer 負責 Business Logic。

主要 Services：

```text
services/

├── auth_service.py
├── user_service.py
├── record_service.py
├── upload_service.py
├── annotation_service.py
├── tag_service.py
├── dashboard_service.py
└── compare_service.py
```

Service 可呼叫：

* Repository
* Storage Service
* Auth Provider

Service 不直接接收 Raw HTTP Request。

---

# 8. Repository Layer

Repository Layer 負責 Database Access。

主要 Repositories：

```text
repositories/

├── user_repository.py
├── record_repository.py
├── annotation_repository.py
├── tag_repository.py
└── dashboard_repository.py
```

Repository 僅負責：

* Query
* Insert
* Update
* Delete

Repository 不處理：

* Auth
* Signed URL
* Business Rules

---

# 9. Storage Layer

Storage Layer 負責 Google Cloud Storage。

```text
storage/

├── gcs_client.py
├── signed_url_service.py
└── storage_paths.py
```

Storage Layer 負責：

* Generate Signed Upload URL
* Generate Signed Download URL
* Delete Object
* Validate Storage Path
* Build Storage Path

Storage Layer 不負責：

* API Response
* Record Business Rules

---

# 10. Schema Layer

Schemas 使用 Pydantic。

負責：

* Request Validation
* Response Serialization
* Type Safety

建議分成：

```text
schemas/

├── user.py
├── record.py
├── upload.py
├── annotation.py
├── tag.py
├── dashboard.py
└── compare.py
```

---

# 11. Database Models

Database Models 對應 PostgreSQL Tables。

Models 不等同 Domain Model。

例如：

Domain：

```text
Record
```

Database 可能拆成：

```text
records
videos
pose_files
metric_files
annotations
record_tags
```

Database Schema 於後續文件定義。

---

# 12. Authentication Architecture

MVP 使用 Google OAuth。

Backend 負責：

* OAuth Callback
* User Mapping
* Session / Token Validation
* Current User Dependency

所有受保護 API 皆需：

```text
current_user
```

---

# 13. Authorization Rules

基本規則：

* User 只能讀取自己的 Records
* User 只能修改自己的 Records
* User 只能刪除自己的 Records
* Annotation 必須屬於該 User 的 Record
* Upload 必須綁定該 User 的 Record

未來可新增：

* Coach Permission
* Organization Role
* Shared Record

---

# 14. Record Service

Record Service 負責：

* Create Record
* List Records
* Get Record Detail
* Update Record
* Delete Record
* Manage Record Status

Record Status 包含：

```text
Uploading
Processing
Ready
Failed
```

---

# 15. Upload Service

Upload Service 負責：

* Request Video Upload URL
* Complete Video Upload
* Request Pose Upload URL
* Complete Pose Upload
* Request Metrics Upload URL
* Complete Metrics Upload

Upload Service 必須：

* 驗證 User Ownership
* 驗證 Content Type
* 建立 Storage Path
* 保存 Upload Metadata
* 更新 Record Status

---

# 16. Annotation Service

Annotation Service 負責：

* List Annotations
* Create Annotation
* Update Annotation
* Delete Annotation

Annotation 僅支援 Viewer。

Compare Annotation 屬 Future Work。

---

# 17. Tag Service

Tag Service 負責：

* List Tags
* Create Tag
* Delete Tag
* Attach Tag to Record
* Remove Tag from Record

Tag 為使用者自訂，不限制運動類型。

---

# 18. Dashboard Service

Dashboard Service 負責：

* Total Records
* Recent Records
* Metric Trends
* Summary Statistics

Dashboard 不讀取：

* Video
* Pose Dataset
* Metric Series

Dashboard 僅依賴：

* Record Metadata
* Metric Summary

---

# 19. Compare Service

Compare Service 負責：

* 驗證兩筆 Record ownership
* 取得兩筆 Record Metadata
* 產生 Video / Pose / Metrics Signed URLs
* 提供 Sync Suggestion API

Compare Service 不負責：

* Canvas Rendering
* Visualization
* Overlay Compare
* Manual Sync UI

---

# 20. Error Handling

Backend 應統一錯誤格式：

```json
{
  "error": {
    "code": "RECORD_NOT_FOUND",
    "message": "Record not found."
  }
}
```

常見錯誤：

* UNAUTHORIZED
* FORBIDDEN
* RECORD_NOT_FOUND
* UPLOAD_FAILED
* INVALID_STORAGE_PATH
* VALIDATION_ERROR

---

# 21. Logging

Backend 應記錄：

* Request ID
* User ID
* Endpoint
* Error Code
* Storage Operation
* Upload Completion
* Record Status Change

避免記錄：

* Sensitive Token
* Raw File Content
* Signed URL Full Value

---

# 22. Backend Boundaries

Backend 不應：

* 直接計算 Metrics（MVP）
* 執行 Pose Detection（MVP）
* 建立 Canvas Visualization
* 暴露 Motion Model
* 暴露 Metrics Engine
* 儲存大型 JSON 於 Database

---

# 23. Future Extensions

未來 Backend 可新增：

* Background Worker
* Analysis Queue
* Backend-side Pose Processing
* Backend-side Metrics Recalculation
* Report Generation
* Coach / Organization Permission
* Share Link

這些擴充不應破壞既有 API Resource Boundary。

---

# 24. Design Decisions

* Backend 採 Router / Service / Repository 分層。
* Backend API 以產品 Resource 為邊界。
* Backend 不暴露內部 Engine。
* Backend 不執行 Motion Analysis（MVP）。
* GCS 操作集中於 Storage Layer。
* Upload 透過 Signed URL。
* Dashboard 僅依賴 Summary Data。
* Authorization 以 Record Ownership 為核心。

---

# 25. Related Documents

Depends On

* 05_TECH_STACK_SPEC.md
* 07_STORAGE_SPEC.md
* 12_API_SPEC.md

Related

* 06_DATA_MODEL_SPEC.md
* 13_FRONTEND_ARCHITECTURE.md
* 15_UI_COMPONENT_SPEC.md
* 16_CODING_GUIDELINES.md

---

# 26. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Patch 1 Addendum — Record / Upload / Artifact Backend Contract

Status: Patch 1 Applied  
Source: SPEC_PATCH_PLAN_01_CRITICAL_ITEMS.md

## Record Service Responsibilities

Record Service owns：

* Create Uploading Record
* Validate user ownership
* Manage Record status transitions
* Finalize Record
* Persist failure metadata
* Ensure required artifacts exist before Ready

Canonical status：

```text
Uploading
Processing
Ready
Failed
Archived(Future)
```

## Upload Service Responsibilities

Upload Service owns：

* Request Video Upload URL
* Complete Video Upload
* Request Pose Upload URL
* Complete Pose Upload
* Request Metrics Upload URL
* Complete Metrics Upload
* Request Thumbnail Upload URL
* Complete Thumbnail Upload
* Validate content type
* Persist artifact metadata

## Storage Layer Responsibilities

Storage Layer owns：

* Build canonical storage path
* Generate signed upload URL
* Generate signed download URL
* Validate storage path belongs to recordId
* Delete object

Frontend must not invent official storage paths.

## Required Artifact Finalization

Record may become `Ready` only after：

* Video artifact complete
* Pose Dataset artifact complete
* Metric Series artifact complete
* Metric Summary persisted
* Thumbnail artifact complete

## Metric Summary Persistence

Metric Summary is structured data in PostgreSQL.

Metric Series is stored as GCS object.

## Failure Metadata

Failed Record should include：

* failureStage
* failureCode
* failureMessage
* failedAt
* retryCount
* retryable

## Auth / Ownership Rule

All upload and complete operations must validate：

```text
current_user owns recordId
```

## Backend Boundary Reminder

Backend MVP still does not execute：

* Pose Detection
* Motion Model Generation
* Metrics Calculation
* Visualization Rendering

