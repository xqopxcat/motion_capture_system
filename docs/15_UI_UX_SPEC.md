# 15_UI_UX_SPEC.md

# Motion Capture Platform - UI / UX Specification

---

| Item         | Value                                          |
| ------------ | ---------------------------------------------- |
| Document     | 15_UI_UX_SPEC.md                               |
| Version      | 1.6                                            |
| Status       | Draft                                          |
| Owner        | MengJu Lee                                     |
| Last Updated | 2026-06-26                                     |
| Depends On   | 02_PRODUCT_SPEC.md、13_FRONTEND_ARCHITECTURE.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 User Experience（UX）與 User Interface（UI）設計原則。

本文件聚焦於：

* 使用流程（User Flow）
* Interaction Design
* Navigation
* Information Architecture
* Screen Layout
* User Experience

本文件不定義：

* Component API
* UI Component Props
* CSS Design

上述內容由：

16_UI_COMPONENT_SPEC.md

定義。

---

# 2. UX Principles

平台遵循以下 UX 原則：

## Analysis First

使用者應專注於：

Motion Analysis。

而非操作系統。

---

## Minimal Cognitive Load

畫面避免同時出現大量資訊。

只呈現：

目前最需要的內容。

---

## Progressive Disclosure

進階資訊：

只有需要時才展開。

例如：

Metrics

Annotation

Advanced Compare

---

## Consistency

Capture

Viewer

Compare

皆採相同操作邏輯。

---

## Non-destructive

所有操作：

不修改 Raw Pose。

不修改 Video。

---

## Context-aware Device Design

不同功能應依使用情境優化裝置體驗：

* Capture：Mobile / Tablet First
* Viewer / Compare：Desktop First

---

# 3. Navigation

主要 Navigation：

```text
/login

↓

/dashboard

↓

/capture

↓

/records

↓

/records/:recordId

↓

/compare
```

---

## Route Definition

Compare 為**獨立頁面與獨立 Route**，而非 Viewer 的附屬功能。

Viewer 採用 Records 子路由設計，而非獨立 `/viewer` 路徑。

建議 Route 結構：

```text
/login
/dashboard
/capture
/records
/records/:recordId
/compare
/compare?left=:recordId&right=:recordId
```

---

Navigation 行為：

* Viewer（/records/）可返回 Records
* Compare 可返回 Records 或 Viewer
* Compare 可以從三種方式進入：

  * 在 Sidebar 主功能表直接進入 Compare 頁面，並於頁面內選擇兩筆 Records
  * 在 Records 頁面直接選擇兩筆資料進入 Compare
  * 在 Viewer 中選擇另一筆資料後進入 Compare

---

設計原則：

* Viewer 為 Records 的延伸（Record Detail View）
* Compare 為「分析模式切換」，不是 Viewer 的子功能
* Compare 同時具備「獨立入口」與「上下文入口」
* 使用者應能直接進入 Compare，而不需先進入 Viewer

---

# 4. Information Architecture

```text
Dashboard

├── Recent Records

├── Progress

└── Statistics

Capture

Records

Viewer (Record Detail)

Compare

Settings (Future)
```

所有 Motion Data 集中於：

Records。

---

# 5. Screen Layout Philosophy

所有主要頁面皆採：

```text
Header

↓

Main Content

↓

Optional Side Panel
```

避免：

多層 Sidebar。

---

# 6. Capture UX

Capture 為行動裝置優先設計（Mobile / Tablet First）。

使用情境：

* 使用者手持手機或平板進行錄影
* 即時觀察姿勢與骨架

---

Capture 重點：

* Camera Preview（全螢幕優先）
* Skeleton Overlay
* Angle Overlay（簡化顯示）
* Record Button（大尺寸、易點擊）

---

設計原則：

* 單手操作友善
* 高對比 UI（戶外可視）
* 最少 UI 干擾

---

Recording 時：

避免：

* Popup
* Dialog
* Drawer

使用者應專注錄影。

---

# 7. Viewer UX

Viewer 為整個產品核心（Record Detail View）。

Route：

```text
/records/:recordId
```

主要使用情境：

* Desktop 分析
* 精細操作（Timeline / Annotation）

---

Layout：

```text
Video

↓

Timeline

↓

Metrics

↓

Annotation Drawer
```

---

主要互動：

Timeline

↓

Frame

↓

Metrics

↓

Annotation

---

# 8. Timeline UX

Timeline 為 Viewer 核心。

支援：

* Click
* Drag
* Hover
* Jump

Annotation Marker：

直接顯示於 Timeline。

Click Marker：

↓

Jump Frame。

---

# 9. Annotation UX

Annotation 採：

Timeline +

Right Drawer。

流程：

```text
Pause

↓

Click Joint

↓

Create Annotation

↓

Save
```

---

## Annotation List Interaction

Annotation Drawer 中的 Annotation List 應支援以下操作：

### 可操作項目

* 編輯 Annotation 名稱（Title）
* 編輯 Annotation 內容（Description / Note）
* 刪除 Annotation
* 點擊 Annotation → 跳轉至對應 Frame

---

### 不可修改項目（Immutable）

為確保資料一致性與避免誤操作：

* 不可修改 Joint
* 不可修改 Frame / Timeline 位置

若需變更上述資訊：

使用者需：

刪除 Annotation

↓

重新建立 Annotation

---

### 設計原則

* Annotation 為「時間點 + 關節」的綁定資料
* 編輯僅限於「描述資訊」
* 避免破壞分析結果的時間與空間對應關係

---

## Annotation Drawer Access

除了透過 Timeline Marker 開啟 Annotation Drawer 外，系統應提供額外入口以提升可發現性與操作效率：

* Viewer Header 或 Toolbar 提供「Annotation」按鈕
* 快捷鍵（例如：`E` 或 `Tab`）可開啟 / 關閉 Drawer
* 當使用者點擊 Joint（即使未建立 Annotation）時，可直接開啟 Drawer 進入建立流程

設計原則：

* Timeline 為主要入口（Primary Entry）
* Button / Shortcut 為輔助入口（Secondary Entry）
* 所有入口行為一致（開啟同一 Drawer 狀態）

---

# 10. Compare UX

Compare 為**獨立分析頁面（Standalone Analysis Page）**。

---

## Layout

Compare 採：

Side-by-side。

```text
Left Video        | Right Video

↓

Shared Timeline

↓

Shared Metrics
```

---

左右畫面：

完全對稱。

共用：

* Playback
* Timeline
* Metrics

各自：

* Video
* Skeleton
* Overlay

---

## Entry Flow

使用者可透過以下方式進入 Compare：

```text
Sidebar

↓

Compare Page

↓

Select 2 Records

↓

Start Compare
```

或：

```text
Records

↓

Select 2 Records

↓

Compare
```

或：

```text
Viewer

↓

Select Another Record

↓

Enter Compare
```

---

## Interaction Model

Compare 為「同步分析模式」：

* Timeline 同步
* Playback 同步
* Frame 對齊

---

## Limitations（MVP）

Compare 不提供：

* Annotation
* Editing

僅提供：

* 視覺比較
* 動作分析

---

## Design Principle

* Compare 為「分析模式」，不是 Viewer 的延伸 UI
* 必須具備獨立 URL、可分享、可直接進入
* 提供 Sidebar 直接入口，支援從零開始選擇資料
* 同時支援從 Records / Viewer 快速進入
* 操作邏輯與 Viewer 保持一致，但功能更精簡

---

# 11. Metrics UX

Metrics 不應：

蓋住人體。

建議：

集中於：

Bottom Panel

或

Right Panel。

Viewer：

顯示：

目前 Frame。

Dashboard：

顯示：

Summary。

---

# 12. Playback UX

Playback 支援：

* Play
* Pause
* Previous Frame
* Next Frame
* Jump Frame
* Speed Control

預設：

1x。

支援：

0.25x

0.5x

1x

2x

---

# 13. Keyboard Shortcuts

Viewer：

| Key       | Action                   |
| --------- | ------------------------ |
| Space     | Play / Pause             |
| ←         | Previous Frame           |
| →         | Next Frame               |
| Shift + ← | -10 Frames               |
| Shift + → | +10 Frames               |
| A         | Previous Annotation      |
| D         | Next Annotation          |
| E         | Toggle Annotation Drawer |

Compare：

共用相同快捷鍵（不包含 Annotation 相關功能）。

---

# 14. Responsive Strategy

本平台採 **Context-driven Responsive Strategy**：

不同功能依使用情境採不同優先裝置。

---

## Capture（Mobile / Tablet First）

Capture 為核心行動場景：

* 必須完整支援 Mobile 與 Tablet
* UI 需針對觸控優化
* Camera Preview 優先全螢幕
* 控制元件需大尺寸、易點擊

Desktop：

* 僅作為輔助（例如測試或外接攝影機）
* 非主要使用場景

---

## Viewer / Compare（Desktop First）

Viewer 與 Compare 為分析場景：

* Desktop 為主要使用裝置
* 支援精細操作（Timeline / Annotation / Compare）

Tablet：

* 基本支援（簡化操作）

Mobile：

* Viewer：Read Only（播放 + 基本瀏覽）
* Compare：不支援（MVP）

---

## Dashboard / Records

* Desktop：完整功能
* Tablet：完整或接近完整
* Mobile：簡化版（列表 + 基本資訊）

---

# 15. Loading Experience

Loading：

Skeleton Screen。

避免：

空白畫面。

Upload：

Progress Bar。

Analysis：

Processing Indicator。

---

# 16. Empty States

若：

無 Record。

應引導：

Capture。

若：

無 Annotation。

顯示：

"Create your first annotation."

---

# 17. Error Handling UX

Upload Failed：

Retry。

Record Failed：

Retry Analysis（Future）。

Network Error：

Retry。

不得：

直接重新整理頁面。

---

# 18. Accessibility

MVP 支援：

* Keyboard Navigation
* Focus Indicator
* Semantic HTML
* Color Contrast

未來：

ARIA。

Screen Reader。

---

# 19. Future UX

Future：

* Overlay Compare
* AI Coach Panel
* Multi-video Compare
* Motion Heatmap
* 3D Viewer
* Coach Review Mode

---

# 20. Design Decisions

* Viewer 為產品核心（Record Detail View）。
* Viewer Route 採 `/records/:recordId`，而非 `/viewer/:recordId`。
* Timeline 為主要互動入口。
* Annotation 採 Timeline + Drawer。
* Annotation Drawer 提供多入口（Timeline / Button / Shortcut）。
* Annotation 僅允許編輯內容與名稱，不可修改 Joint 與 Frame。
* Compare 為獨立頁面與獨立 Route。
* Compare 提供 Sidebar 直接入口，並支援頁面內選擇 Records。
* Compare 同時支援從 Records / Viewer 快速進入。
* Compare 採 Side-by-side。
* Metrics 不遮蔽人體。
* Dashboard 只顯示 Summary。
* Capture 採 Mobile / Tablet First。
* Viewer / Compare 採 Desktop First。

---

# 21. Related Documents

Depends On

* 02_PRODUCT_SPEC.md
* 13_FRONTEND_ARCHITECTURE.md

Related

* 16_UI_COMPONENT_SPEC.md
* 11_VISUALIZATION_ENGINE_SPEC.md

---

# 22. Revision History

| Version | Date       | Description                                                                |
| ------- | ---------- | -------------------------------------------------------------------------- |
| 1.0     | 2026-06-26 | Initial Draft                                                              |
| 1.1     | 2026-06-26 | Add Annotation Drawer multi-access                                         |
| 1.2     | 2026-06-26 | Add Annotation edit/delete constraints in Drawer                           |
| 1.3     | 2026-06-26 | Redefine Responsive Strategy (Capture Mobile First)                        |
| 1.4     | 2026-06-26 | Define Compare as standalone route and page                                |
| 1.5     | 2026-06-26 | Update routing structure (Viewer under /records)                           |
| 1.6     | 2026-06-26 | Add Compare as standalone sidebar entry with in-page record selection flow |

---

# Upload / Analysis / Compare UX State Contract

## Capture Completion UX States

Capture completion should expose these user-visible or system-visible states：

```text
Analyzing in browser
Creating record
Uploading video
Uploading pose
Uploading metrics
Uploading thumbnail
Finalizing record
Ready
Failed with retry
```

## Upload Failure UX

Upload or finalization failure should show：

* Current failed stage
* User-friendly message
* Retry action if retryable
* Return to Records or Capture option

## Compare MVP Sync UX

Compare MVP supports：

* Suggested sync point
* Manual offset adjustment
* Shared playback
* Side-by-side comparison

MVP does not require perfect automatic alignment.

## Annotation MVP Boundary

Annotation remains Viewer-only.

Annotation frame and joint are immutable after creation. To change frame or joint, user must delete and recreate annotation.

Compare does not support Annotation in MVP.

