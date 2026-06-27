# 01_PROJECT_OVERVIEW.md

# Motion Capture Platform - Project Overview

---

| Item         | Value                  |
| ------------ | ---------------------- |
| Document     | 01_PROJECT_OVERVIEW.md |
| Version      | 1.1                    |
| Status       | Draft                  |
| Owner        | MengJu Lee             |
| Last Updated | 2026-06-26             |
| Depends On   | 00_MASTER_CONTEXT.md   |

---

# 1. Purpose

本文件為 Motion Capture Platform 的專案總覽（Project Overview）。

其目的不是詳細定義功能，而是在任何人閱讀本專案時，都能於 10~15 分鐘內理解：

* 產品定位
* 核心理念
* 系統架構
* 文件組成
* 開發方向
* 專案目標

本文件屬於整個 Design Document 的入口（Entry Point）。

若與 **00_MASTER_CONTEXT.md** 衝突，以 Master Context 為最高優先級。

---

# 2. Background

近年來，AI Pose Estimation 技術快速成熟。

MediaPipe、MoveNet、OpenPose 等技術皆能快速從影片推論人體骨架。

然而，多數產品仍停留在：

* Skeleton Demo
* 單次分析
* 特定運動分析工具

缺乏：

* 長期資料管理
* Motion Comparison
* Progress Tracking
* Annotation
* 通用 Motion Framework

本專案希望建立一套真正可持續擴充的 Motion Analysis Platform。

---

# 3. Vision

建立一套：

**Web-first Motion Capture Platform**

讓使用者僅需：

* 一支手機
* 一個瀏覽器

即可完成：

Motion Capture

↓

Motion Analysis

↓

Motion Comparison

↓

Performance Tracking

↓

Future AI Coaching

平台本身不依賴任何特定運動，也不依賴任何特定 AI Engine。

---

# 4. Goals

本專案主要目標：

## 4.1 建立通用 Motion Platform

平台應支援：

* 深蹲
* 跑步
* 滑雪
* 高爾夫
* 棒球
* 網球
* 復健

而不是重新設計不同系統。

---

## 4.2 建立可重複利用的 Motion Architecture

平台核心應包含：

* Pose
* Motion Model
* Metrics
* Visualization

所有運動皆建立於此 Architecture。

---

## 4.3 建立完整 Motion Record

每次錄影都應建立：

* Video
* Pose
* Metrics
* Annotation
* Tags
* Metadata

形成可持續累積的 Motion Database。

---

## 4.4 建立長期 Progress Tracking

平台應讓使用者能：

* 查看歷史紀錄
* 比較不同 Session
* 觀察進步趨勢

而非只分析單一影片。

---

# 5. Non-goals

MVP 不包含：

* AI Coach
* Injury Diagnosis
* Medical Advice
* Organization Workspace
* Multi-camera Capture
* Native Mobile App
* Wearable Integration
* Force Plate
* EMG Integration

以上皆屬於 Future Scope。

---

# 6. Target Users

## MVP

### Individual Athlete

希望自行分析動作的使用者。

例如：

* 健身
* 深蹲
* 重訓
* 滑雪
* 球類運動

---

### Sports Enthusiast

希望了解自身動作品質，而非專業運動員。

---

### Personal Coach

可協助學生：

* Capture
* Viewer
* Annotation
* Compare

---

## Future

* Sports Academy
* Professional Team
* Physical Therapist
* Rehabilitation Center

---

# 7. Product Positioning

本產品不是：

* Pose Detection Demo
* Skeleton Viewer
* AI Showcase

本產品定位為：

**Motion Analysis Platform**

平台核心：

```text
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

Insight (Future)
```

任何 AI Engine 都只是：

Pose Provider。

而非平台核心。

---

# 8. Core Capabilities

MVP 將提供：

## Capture

Browser Camera

Real-time Skeleton

Real-time Joint Angles

Video Recording

---

## Record Management

Record List

Tag

Rename

Search

Filter

Sort

Delete

---

## Motion Viewer

逐幀播放

Skeleton Overlay

Metrics

Timeline

Annotation

---

## Compare

Side-by-side

Semi Auto Sync

Metrics Comparison

Difference Visualization

---

## Dashboard

Progress

Trend

Session History

Summary Metrics

---

# 9. High-Level Architecture

```text
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

Viewer
Compare
Dashboard
```

Backend：

負責：

* Authentication
* Metadata
* Storage
* Signed URL
* REST API

不負責：

* Pose Detection
* Metrics Calculation
* Rendering

---

# 10. Core Design Principles

平台遵循：

## Engine Agnostic

可替換：

MediaPipe

↓

MoveNet

↓

OpenPose

不影響 Architecture。

---

## Motion Agnostic

平台不依賴：

深蹲

跑步

滑雪

等單一 Motion。

---

## Sport Agnostic

運動只是：

Metrics Module。

平台本身保持中立。

---

## Modular

各 Engine 彼此獨立。

降低耦合。

---

## Extensible

未來新增：

AI Coach

3D Viewer

Heatmap

IMU

皆不需推翻既有 Architecture。

---

# 11. Project Scope

## MVP

* Google Login
* Browser Capture
* Pose Detection
* Skeleton Overlay
* Joint Angle Overlay
* Record Management
* Viewer
* Compare
* Annotation
* Dashboard

---

## Future

* AI Coach
* Overlay Compare
* Motion Heatmap
* Multi-person
* 3D Visualization
* Coach Workspace
* Organization
* Wearable Integration

---

# 12. Documentation Structure

所有設計文件皆位於：

```text
docs/
```

依閱讀順序：

```text
00_MASTER_CONTEXT.md

↓

01_PROJECT_OVERVIEW.md

↓

02_PRODUCT_SPEC.md

↓

03_SYSTEM_ARCHITECTURE.md

↓

04_ANALYSIS_PIPELINE_SPEC.md

↓

05_TECH_STACK_SPEC.md

↓

06_DATA_MODEL_SPEC.md

↓

07_STORAGE_SPEC.md

↓

08_POSE_SCHEMA_SPEC.md

↓

09_MOTION_MODEL_SPEC.md

↓

10_METRICS_ENGINE_SPEC.md

↓

11_VISUALIZATION_ENGINE_SPEC.md

↓

12_API_SPEC.md

↓

13_FRONTEND_ARCHITECTURE.md

↓

14_BACKEND_ARCHITECTURE.md

↓

15_UI_UX_SPEC.md

↓

16_UI_COMPONENT_SPEC.md

↓

17_CODING_GUIDELINES.md

↓

18_DECISION_LOG.md

↓

19_BACKLOG.md

↓

20_AGENTS.md
```

---

# 13. Development Roadmap

## Phase 1

Architecture Foundation

完成所有 Design Docs。

---

## Phase 2

Architecture Review

Review

Approve

Architecture Freeze

---

## Phase 3

Sprint 0

Project Bootstrap

Development Environment

CI/CD

---

## Phase 4

Sprint 1

Capture

---

## Phase 5

Sprint 2

Viewer

---

## Phase 6

Sprint 3

Compare

---

## Phase 7

Sprint 4

Dashboard

---

# 14. Success Criteria

MVP 完成時應滿足：

* 使用者可於 Browser 完成 Capture
* Record 可完整保存
* Viewer 可逐幀分析
* Compare 可同步播放兩筆 Record
* Annotation 可管理所有標註
* Dashboard 可追蹤歷史趨勢
* 整體 Architecture 可支援未來新運動

---

# 15. References

Depends On

* 00_MASTER_CONTEXT.md

Related Documents

* 02_PRODUCT_SPEC.md
* 03_SYSTEM_ARCHITECTURE.md

---

# 16. Revision History

| Version | Date       | Description                    |
| ------- | ---------- | ------------------------------ |
| 1.0     | 2026-06-26 | Initial Draft                  |
| 1.1     | 2026-06-26 | Added 07_STORAGE_SPEC.md entry |
