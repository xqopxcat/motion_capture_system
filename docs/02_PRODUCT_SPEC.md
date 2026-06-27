# 02_PRODUCT_SPEC.md

# Motion Capture Platform - Product Specification

---

| Item         | Value                                       |
| ------------ | ------------------------------------------- |
| Document     | 02_PRODUCT_SPEC.md                          |
| Version      | 1.1                                         |
| Status       | Draft                                       |
| Owner        | MengJu Lee                                  |
| Last Updated | 2026-06-26                                  |
| Depends On   | 00_MASTER_CONTEXT.md、01_PROJECT_OVERVIEW.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的產品需求（Product Requirements）。

目的為：

* 定義產品定位
* 定義 MVP 範圍
* 定義產品功能
* 定義使用者流程
* 作為 UI、API、Data Model 與後續開發的依據

本文件不討論：

* API 設計
* Database Schema
* UI Layout 細節
* 技術實作方式

上述內容將於後續 Design Docs 定義。

---

# 2. Product Vision

Motion Capture Platform 是一套 **Web-first Motion Analysis Platform**。

產品希望降低 Motion Capture 的門檻，使使用者無須專業攝影設備，即可完成高品質的動作分析。

平台核心能力包括：

* Motion Capture
* Motion Analysis
* Motion Comparison
* Progress Tracking

未來可擴充：

* AI Coach
* Coach Workspace
* Team Collaboration
* Sport-specific Modules

---

# 3. Product Goals

本產品希望解決以下問題：

## Goal 1：降低 Motion Capture 成本

使用瀏覽器與一般手機即可完成動作擷取。

---

## Goal 2：建立可重複分析的 Motion Record

每次錄影都保存完整分析資料，而非一次性分析。

每筆 Record 包含：

* Video
* Pose
* Metrics
* Metadata
* Annotation
* Tags

---

## Goal 3：提供直覺的 Motion Analysis

使用者可：

* 逐幀播放
* 查看 Skeleton Overlay
* 查看 Joint Angle
* 查看 Metrics
* 查看 Annotation

---

## Goal 4：建立長期 Progress Tracking

透過 Dashboard 追蹤：

* Motion Quality
* Range of Motion
* Symmetry
* Training History

---

## Goal 5：建立可擴充的平台

未來可新增：

* 新運動
* 新 Metrics
* 新 Visualization
* AI Coach

而不需修改核心 Architecture。

---

# 4. Non-goals

MVP 不包含：

* AI 教學建議
* 醫療診斷
* 傷害預測
* 多人同時分析
* 多鏡頭同步
* Native Mobile App
* Team Workspace
* Organization Management

---

# 5. Target Users

## Individual Athlete

自行分析動作。

---

## Sports Enthusiast

提升運動表現。

---

## Coach

協助學生分析與比較動作。

---

## Physical Therapist

用於復健評估與動作分析。

---

## Future Users

* Rehabilitation Center
* Professional Team
* Sports Academy

---

# 6. MVP Functional Modules

MVP 包含六大模組。

## Authentication

* Google Login
* Logout
* User Profile

---

## Capture

功能：

* Camera Preview
* Real-time Skeleton Overlay
* Real-time Joint Angle Overlay
* Recording
* Upload
* Analysis

輸出：

一筆新的 Record。

---

## Record Management

管理所有 Motion Record。

功能：

* List/Grid
* Rename
* Tag
* Delete
* Search
* Filter
* Sort

---

## Motion Viewer

功能：

* Video Playback
* Skeleton Overlay
* Frame-by-frame
* Timeline
* Metrics Panel
* Annotation

---

## Motion Compare

功能：

* Side-by-side Compare
* Semi-auto Sync
* Metrics Comparison
* Difference Display

MVP 不提供：

* Overlay Compare
* Annotation（將作為 Future Work）

---

## Dashboard

功能：

* Recent Records
* Progress
* Trend
* Session Summary
* Statistics

Dashboard 使用 Summary Data，不重新分析影片。

---

# 7. User Journey

## Capture

Login

↓

Capture

↓

Recording

↓

Upload

↓

Analysis

↓

Record Created

---

## Review

Record List

↓

Open Viewer

↓

Playback

↓

Annotation

↓

Save

---

## Compare

Record A

*

Record B

↓

Sync

↓

Compare Metrics

---

## Dashboard

History

↓

Trend

↓

Performance Overview

---

# 8. Core Product Routes

```text
/login

/dashboard

/capture

/records

/records/:recordId

/compare
```

未來：

```text
/settings

/profile

/reports
```

---

# 9. Product Features

## Capture

* Camera Preview
* Skeleton Overlay
* Angle Overlay
* Start / Stop Recording

---

## Viewer

* Frame Navigation
* Skeleton
* Metrics
* Timeline
* Annotation

---

## Compare

* Side-by-side Playback
* Shared Timeline
* Semi-auto Sync
* Sync Offset
* Metrics Difference

（未來可擴充 Annotation 功能）

---

## Dashboard

* Summary Cards
* Trend Charts
* Recent Records

---

# 10. Annotation Philosophy

Annotation 僅存在於 Viewer（MVP）。

包含：

* Timeline Marker
* Right Drawer
* Frame Jump
* Joint Highlight

Compare 不提供 Annotation（MVP）。

未來可擴充：

* Compare Annotation（跨 Record 對照標記）
* Shared Annotation（教練與學員協作）

---

# 11. Compare Philosophy

Compare 採用：

Side-by-side。

原因：

不同錄影之：

* 距離
* 視角
* 人體比例
* 拍攝時間

Overlay 容易造成誤判。

未來可新增：

* Overlay Mode
* Compare Annotation

---

# 12. Dashboard Philosophy

Dashboard 的目的不是顯示所有數據，而是協助使用者快速理解自己的訓練成果。

重點包含：

* Progress
* Trend
* Consistency
* Session Summary

---

# 13. Success Metrics

MVP 完成時應具備：

* 可完成 Browser Capture
* 每筆 Record 可永久保存
* Viewer 可逐幀分析
* Compare 可同步比較兩筆 Record
* Annotation（Viewer）可完整管理
* Dashboard 可呈現歷史趨勢

---

# 14. Out of Scope

以下功能不納入 MVP：

* AI Coach
* Overlay Compare
* Compare Annotation
* Motion Heatmap
* 3D Viewer
* Organization
* Wearable Integration
* Force Plate
* EMG
* Multi-camera

---

# 15. Related Documents

本文件僅列出與 Product Specification 直接相關且在設計流程中具有依賴關係的文件，而非完整文件清單。

Depends On

以下文件為本文件的前置依據，定義產品背景與整體方向：

* 00_MASTER_CONTEXT.md（專案核心原則與設計哲學）
* 01_PROJECT_OVERVIEW.md（產品概覽與高層描述）

Related

以下文件會依據本文件進一步展開具體設計：

* 03_SYSTEM_ARCHITECTURE.md（系統架構與模組分層）
* 11_API_SPEC.md（後端 API 設計）
* 14_UI_UX_SPEC.md（使用者介面與互動設計）

未列入的文件（例如 Data Model、Metrics Engine、Visualization 等）將在後續設計階段逐步建立，並會依賴本文件中的產品定義，但不屬於本階段的直接關聯文件。

---

# 16. Revision History

| Version | Date       | Description                           |
| ------- | ---------- | ------------------------------------- |
| 1.1     | 2026-06-26 | Add Compare Annotation as Future Work |
| 1.0     | 2026-06-26 | Initial Draft                         |

---

# MVP Completion Contracts

## Capture Completion Contract

MVP 中一次 Capture 成功完成，定義如下：

```text
User records video
↓
Browser generates required analysis artifacts
↓
System creates a Record
↓
Required artifacts are uploaded
↓
Record becomes Ready or Failed
```

Capture 成功不代表只完成錄影，而是必須產生一筆可在 Records / Viewer / Compare / Dashboard 使用的 Record。

MVP required artifacts：

* Video
* Pose Dataset
* Metric Series
* Metric Summary
* Thumbnail

## Compare MVP Boundary

Compare MVP 僅包含：

* Side-by-side playback
* Shared playback controls
* Manual or semi-auto sync point
* Sync offset adjustment
* Basic metric difference display

Compare MVP 不包含：

* Overlay Compare
* Compare Annotation
* Multi-video Compare
* Fully automatic alignment
* AI-generated comparison insight

## Dashboard MVP Boundary

Dashboard MVP 僅依賴 Metric Summary 與 Record Metadata。

Dashboard MVP 包含：

* Recent Records
* Basic Summary Cards
* Metric Summary-based Trend

Dashboard MVP 不包含：

* Re-analysis
* Metric Series loading
* Advanced insight
* AI Coach recommendation

## MVP Acceptance Criteria Baseline

MVP feature 完成條件必須至少包含：

* 使用者可完成主要流程
* 必要資料可被保存
* Ready / Failed 狀態可被辨識
* Viewer / Compare / Dashboard 可取得所需資料
* 不需要依賴 Future Scope 功能

