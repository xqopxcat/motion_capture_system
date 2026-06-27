# 16_UI_COMPONENT_SPEC.md

# Motion Capture Platform - UI Component Specification

---

| Item         | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Document     | 16_UI_COMPONENT_SPEC.md                                                      |
| Version      | 1.0                                                                          |
| Status       | Draft                                                                        |
| Owner        | MengJu Lee                                                                   |
| Last Updated | 2026-06-26                                                                   |
| Depends On   | 11_VISUALIZATION_ENGINE_SPEC.md、13_FRONTEND_ARCHITECTURE.md、15_UI_UX_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 UI Component Library（Motion Design System）。

目的：

* 建立一致的 UI 元件
* 提供所有頁面共用 Component
* 降低重複開發
* 作為 Storybook 與 Codex Component Generation 的依據

本文件定義：

* Component Responsibility
* Component Composition
* Component Interaction
* Component State

本文件不定義：

* CSS Implementation
* Theme Tokens
* Visual Style Guide

---

# 2. Design Principles

所有 Components 應符合：

* Single Responsibility
* Reusable
* Composable
* Stateless Preferred
* Accessible
* Responsive
* Feature Agnostic

Component 不應直接依賴：

* API
* RTK Query
* Business Logic

---

# 3. Component Categories

平台元件分為七大類：

```text
Layout Components

Display Components

Motion Components

Visualization Components

Interactive Components

Form Components

Feedback Components
```

---

# 4. Layout Components

負責頁面結構。

包含：

* AppLayout
* Header
* Sidebar
* Toolbar
* ContentArea
* RightDrawer
* BottomPanel

Layout 不包含任何 Business Logic。

---

# 5. Display Components

一般展示元件。

包含：

* Card
* MetricCard
* RecordCard
* StatisticCard
* Tag
* EmptyState
* Avatar

用途：

Dashboard

Records

Settings

---

# 6. Motion Components

Motion Platform 專屬元件。

包含：

```text
VideoPlayer

Timeline

PlaybackControls

MetricPanel

AnnotationDrawer

ComparePanel

FrameIndicator
```

所有 Motion Components 應可重複使用。

---

## VideoPlayer

負責：

* 顯示 video element
* 根據外部 playback state 播放 / 暫停 / seek
* 回報 time / frame change event

VideoPlayer 是 controlled component。

不負責：

* 擁有全域 Playback State
* Skeleton Rendering
* Metrics Calculation

---

## Timeline

負責：

* 顯示 current frame
* Frame Navigation
* Drag
* Jump
* Annotation Marker
* Current Frame Indicator

Timeline 是 controlled component。

Timeline 為 Viewer 核心元件，但不擁有 annotation editing state，也不直接修改 persisted Annotation。

---

## PlaybackControls

提供：

* Play
* Pause
* Previous Frame
* Next Frame
* Speed Control

PlaybackControls 只發出 user intent，不直接控制 video element，也不擁有全域 playback state。

Viewer 與 Compare 共用。

---

## MetricPanel

顯示：

* Current Metrics
* Metric Difference（Compare）
* Metric Trend（Future）

不進行任何 Metrics Calculation。

---

## AnnotationDrawer

負責：

* Annotation List
* Create
* Edit
* Delete
* Jump Frame intent

AnnotationDrawer 負責 editing UI；Timeline 負責 marker；Visualization Engine 負責 canvas anchor / joint highlight。

Drawer 不直接修改 Timeline，也不自行擁有 current frame source of truth。

---

## ComparePanel

Compare 專用控制元件。

包含：

* Left Record Info
* Right Record Info
* Sync Offset
* Playback Status

---

# 7. Visualization Components

Visualization Components 建立於 Visualization Engine。

包含：

```text
SkeletonCanvas

SkeletonOverlay

JointOverlay

MetricOverlay

SelectionOverlay
```

---

## SkeletonCanvas

唯一 Canvas Component。

負責：

* 建立 Canvas
* 接收 Render Context
* 呼叫 Visualization Engine

SkeletonCanvas 是 UI 與 Visualization Engine 的 bridge。

不自行畫 Skeleton、不計算 Metrics、不擁有 playback state。

---

## SkeletonOverlay

Render：

* Bones
* Skeleton

---

## JointOverlay

Render：

* Joint Circle
* Selected Joint
* Hover Joint

---

## MetricOverlay

Render：

* Angle Label
* Metric Label
* Metric Value

---

## SelectionOverlay

Render：

* Hover
* Selected Joint
* Active Segment

---

# 8. Interactive Components

平台互動元件。

包含：

* Dropdown
* ContextMenu
* Modal
* SearchInput
* MultiSelect
* ShortcutHint

皆不依賴 Domain。

---

# 9. Form Components

一般輸入元件。

包含：

* TextField
* TextArea
* Select
* Checkbox
* Switch
* Button
* IconButton

供所有 Feature 共用。

---

# 10. Feedback Components

狀態提示元件。

包含：

* LoadingSpinner
* SkeletonLoader
* ProgressBar
* ErrorState
* Toast
* EmptyState

---

# 11. Component Composition

Viewer：

```text
ViewerPage

└── VideoPlayer

└── SkeletonCanvas

└── Timeline

└── PlaybackControls

└── MetricPanel

└── AnnotationDrawer
```

---

Compare：

```text
ComparePage

├── ComparePanel

├── VideoPlayer (Left)

├── SkeletonCanvas (Left)

├── VideoPlayer (Right)

├── SkeletonCanvas (Right)

├── Timeline

├── PlaybackControls

└── MetricPanel
```

---

Capture：

```text
CapturePage

└── CameraPreview

└── SkeletonCanvas

└── CaptureToolbar

└── RecordingButton

└── RecordingStatus
```

---

# 12. Component State

Component 優先採：

Controlled Component。

State 來源：

* Parent Component
* Redux
* RTK Query
* Visualization Engine

Component 不自行保存：

* Record
* Pose
* Metrics

---

# 13. Naming Convention

所有 Components 採 PascalCase。

例如：

```text
MetricPanel

AnnotationDrawer

SkeletonCanvas

ComparePanel

Timeline
```

每個 Component：

一個資料夾。

```text
Timeline/

├── Timeline.tsx

├── Timeline.module.css

├── Timeline.test.tsx

└── index.ts
```

---

# 14. Accessibility

所有 Components：

* Keyboard Focus
* ARIA（Future）
* Semantic HTML
* Screen Reader Friendly（Future）

Timeline：

須支援 Keyboard Navigation。

---

# 15. Future Components

未來可新增：

* HeatmapPanel
* CoachPanel
* MotionReplay
* 3DViewer
* ReportViewer
* AIInsightPanel

皆不影響既有 Component Library。

---

# 16. Design Decisions

* 採 Motion Design System。
* Timeline 為核心元件。
* SkeletonCanvas 為唯一 Canvas Component。
* Visualization Engine 與 UI Components 分離。
* Viewer / Compare 共用 Motion Components。
* Components 不依賴 Business Logic。
* Components 優先 Stateless。

---

# 17. Related Documents

Depends On

* 11_VISUALIZATION_ENGINE_SPEC.md
* 13_FRONTEND_ARCHITECTURE.md
* 15_UI_UX_SPEC.md

Related

* 17_CODING_GUIDELINES.md
* 18_DECISION_LOG.md

---

# 18. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Core Component Responsibility Contracts

## VideoPlayer Contract

VideoPlayer：

* Is controlled by playback state.
* Emits time / frame updates.
* Does not calculate metrics.
* Does not own global playback state.
* Does not directly call API.

## Timeline Contract

Timeline：

* Receives controlled currentFrame.
* Emits seek / frame change.
* Renders annotation markers.
* Does not own annotation editing.
* Does not calculate metrics.

## PlaybackControls Contract

PlaybackControls：

* Emits play / pause / previous frame / next frame / speed change.
* Does not own video element.
* Does not directly manipulate Canvas.

## SkeletonCanvas Contract

SkeletonCanvas：

* Owns canvas element.
* Calls Visualization Engine.
* Does not draw skeleton outside Visualization Engine.
* Does not own playback state.
* Does not directly load API data.

## AnnotationDrawer Contract

AnnotationDrawer：

* Owns annotation list / create / edit / delete UI.
* Does not modify Timeline position directly.
* Does not change immutable frame / joint binding.

## MetricPanel Contract

MetricPanel：

* Displays provided metric values.
* May display metric difference in Compare.
* Does not calculate metrics.

## ComparePanel Contract

ComparePanel：

* Controls record selection and sync offset UI.
* Does not render video.
* Does not calculate metrics.
* Does not invoke Visualization Engine directly.

