# 20_AGENTS.md

# Motion Capture Platform - AI Agent Collaboration Guide

---

| Item         | Value           |
| ------------ | --------------- |
| Document     | 20_AGENTS.md    |
| Version      | 1.0             |
| Status       | Living Document |
| Owner        | MengJu Lee      |
| Last Updated | 2026-06-26      |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 AI Agent 協作規範。

適用於：

* ChatGPT Codex
* Claude Code
* Cursor AI
* Gemini
* GitHub Copilot
* 未來所有 AI Coding Agent

目的：

* 維持 Architecture Integrity
* 提高 AI 開發品質
* 降低重複實作
* 建立一致開發流程

---

# 2. Core Principles

所有 AI Agent 必須遵守：

* Architecture First
* Documentation First
* Reuse Before Create
* Small Increment
* No Breaking Change Without Approval
* Human-in-the-loop

AI Agent 不得自行重新設計整體架構。

---

# 3. Required Context

開始任何開發工作前，AI Agent 必須先閱讀：

```text
00_MASTER_CONTEXT.md
02_PRODUCT_SPEC.md
05_TECH_STACK_SPEC.md
13_FRONTEND_ARCHITECTURE.md
14_BACKEND_ARCHITECTURE.md
17_CODING_GUIDELINES.md
18_DECISION_LOG.md
19_BACKLOG.md
```

若任務涉及特定領域，還需閱讀對應 Spec。

例如：

Viewer：

```text
11_VISUALIZATION_ENGINE_SPEC.md
15_UI_UX_SPEC.md
16_UI_COMPONENT_SPEC.md
```

Metrics：

```text
08_POSE_SCHEMA_SPEC.md
09_MOTION_MODEL_SPEC.md
10_METRICS_ENGINE_SPEC.md
```

---

# 4. AI Agent Responsibilities

AI Agent 可以：

* 撰寫程式碼
* 重構程式碼
* 補齊型別
* 新增測試
* 修正 Bug
* 更新文件（經使用者要求）

AI Agent 不應：

* 修改產品需求
* 修改 API Contract
* 修改 Architecture
* 新增未討論功能
* 擅自調整資料模型

---

# 5. Development Workflow

所有功能遵循：

```text
Read Specs
      ↓
Understand Context
      ↓
Review Existing Code
      ↓
Implementation Plan
      ↓
Implementation
      ↓
Self Review
      ↓
Human Review
```

不得直接跳至 Implementation。

---

# 6. Task Granularity

AI Agent 應將工作拆成小任務。

例如：

```text
Viewer

├── Timeline
├── Playback
├── Metric Panel
├── Annotation Drawer
└── Keyboard Shortcut
```

避免一次修改過多模組。

---

# 7. Code Generation Rules

新增程式碼前：

必須確認：

* 是否已有 Component
* 是否已有 Hook
* 是否已有 Utility
* 是否已有 Engine
* 是否已有 RTK Query Endpoint

優先重用。

---

# 8. Documentation Rules

若修改：

* API
* Data Model
* Architecture
* Workflow

應同步提醒更新對應 Design Docs。

未經使用者同意，不得自行修改文件內容。

---

# 9. Architecture Boundaries

不得跨越以下邊界：

```text
Page
    ↓
Feature
    ↓
Engine
```

不得：

```text
Engine
    ↓
React Component
```

不得：

```text
Repository
    ↓
Router
```

---

# 10. AI Review Checklist

完成任務前：

確認：

* 是否符合 Coding Guidelines？
* 是否符合 Folder Structure？
* 是否新增重複功能？
* 是否破壞 API？
* 是否破壞 Architecture？
* 是否影響 MVP Scope？

---

# 11. Prompting Guidelines

本節說明如何有效地向 AI Agent 提出開發任務。良好的 Prompt 能大幅提升 AI 產出的品質、準確性與可維護性。

建議使用以下結構化格式來描述任務：

```text
Context:
描述目前的系統背景、相關模組、已存在的功能或限制條件。

Goal:
明確說明這次要完成的目標（例如新增功能、修正 bug、重構某段程式）。

Constraints:
列出必須遵守的限制，例如技術棧、架構規範、不可修改的部分等。

Acceptance Criteria:
定義完成條件，讓 AI 知道什麼情況下任務算完成。
```

---

## 為什麼需要這種格式？

AI 並不像人類開發者能自動理解專案背景，因此：

* Context 幫助 AI 理解目前系統狀態
* Goal 避免 AI 偏離任務方向
* Constraints 防止 AI 破壞架構或使用錯誤技術
* Acceptance Criteria 提供明確驗收標準

缺少這些資訊時，AI 很容易：

* 重複實作已有功能
* 使用錯誤的資料結構
* 違反既有架構設計
* 產出不符合需求的程式碼

---

## 範例（良好 Prompt）

```text
Context:
目前 Viewer 頁面已經有 Timeline UI，但尚未實作播放控制邏輯。
Playback 狀態應由 Redux 管理。

Goal:
實作 Timeline 播放功能，包含 play / pause / seek。

Constraints:
- 必須使用 Redux Toolkit 管理狀態
- 不可直接在 Component 中寫播放邏輯
- 播放邏輯應放在 viewer engine
- 不可修改 API schema

Acceptance Criteria:
- 使用者可以點擊播放按鈕開始播放
- 可以暫停播放
- 可以拖動 timeline 改變播放位置
- 播放狀態可被其他 component 讀取
```

這樣的 Prompt 能讓 AI：

* 知道該修改哪個模組（viewer engine）
* 知道該使用哪種技術（Redux Toolkit）
* 知道哪些地方不能動（API schema）
* 知道完成標準（播放、暫停、seek）

---

## 範例（不良 Prompt）

```text
幫我做 Viewer
```

這種描述過於模糊，會導致：

* AI 不知道要做哪一部分（UI？Engine？API？）
* AI 可能重新設計整個架構
* AI 可能產出與現有系統不相容的程式碼

---

## 建議

* 任務越複雜，Prompt 越需要結構化
* 儘量提供具體模組名稱（例如 viewer engine、metrics engine）
* 明確指出不可修改的部分
* 提供可驗證的 Acceptance Criteria

提供清楚且完整的 Prompt，是確保 AI Agent 能穩定產出高品質程式碼的關鍵。

---


## AI Agent Task Packet Template

AI Agent 只能執行具備明確 acceptance criteria 與 allowed file scope 的任務。每個任務應包含：

```text
Context
Goal
Scope
Affected Docs
Affected Folders
Allowed Changes
Forbidden Changes
Implementation Steps
Acceptance Criteria
Self Review Checklist
```

若任務缺少 Scope、Forbidden Changes 或 Acceptance Criteria，AI Agent 應先要求補齊，不應直接 implementation。

## Sprint 0 Agent Boundary

Sprint 0 agents may create project foundation only.

Sprint 0 agents must not implement：

* Capture feature logic
* Viewer feature logic
* Compare feature logic
* Motion analysis algorithms
* Production auth flow beyond placeholder / contract-ready structure
* New architecture beyond approved docs

---

# 12. Sprint Workflow

每個 Sprint：

```text
Select Feature
      ↓
Read Related Specs
      ↓
Implement
      ↓
Run Tests
      ↓
Review
      ↓
Merge
```

AI Agent 不應自行開始下一個 Sprint。

---

# 13. Multi-Agent Collaboration

若同時使用多個 AI Agent：

建議分工如下：

| Agent          | Responsibility                      |
| -------------- | ----------------------------------- |
| ChatGPT Codex  | Feature Implementation              |
| Claude Code    | Refactoring / Review                |
| Gemini         | Technical Research / API Validation |
| Cursor AI      | IDE Assistance                      |
| GitHub Copilot | Inline Completion                   |

所有 Agent 仍需遵循同一套 Design Docs。

---

# 14. Pull Request Guidelines

每個 PR 應：

* 聚焦單一功能
* 不混合 Refactor 與新功能
* 更新必要文件
* 通過測試

建議 PR 標題遵循：

```text
feat(viewer): add timeline playback

fix(capture): resolve recording state bug

refactor(metrics): simplify registry
```

---

# 15. Forbidden Actions

AI Agent 不得：

* 刪除 Design Docs
* 修改 Architecture Decision Record（架構決策紀錄）（未經允許）
* 更換技術棧
* 新增第三方套件（未經確認）
* 重構整個專案（未經確認）
* 超出 Backlog MVP Scope

---

# 16. Design Decisions

* Design Docs 為唯一設計依據。
* AI Agent 必須先閱讀文件，再實作。
* 優先重用現有程式碼。
* 採小步提交（Small Increment）。
* Human Review 為最終決策。

---

# 17. Related Documents

Depends On

* 00_MASTER_CONTEXT.md
* 17_CODING_GUIDELINES.md
* 18_DECISION_LOG.md
* 19_BACKLOG.md

Related

* All Design Specifications (00–19)

---

# 18. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# AI Agent Sprint Task Packet Template

## Implementation Readiness Rule

AI Agent may only implement tasks with：

* Explicit scope
* Explicit affected folders / files
* Explicit allowed changes
* Explicit forbidden changes
* Explicit acceptance criteria

## Sprint Task Packet Template

Every implementation prompt should include：

```text
Context:
Relevant product / architecture / spec background.

Goal:
The single task to complete.

Scope:
What is included in this task.

Out of Scope:
What must not be changed.

Affected Docs:
Design docs that govern this task.

Affected Folders:
Allowed source folders.

Allowed Changes:
Files or modules the agent may create or modify.

Forbidden Changes:
Architecture / API / data model / dependency changes that are not allowed.

Implementation Steps:
Expected high-level steps.

Acceptance Criteria:
How the task is verified.

Self Review Checklist:
What the AI agent must check before returning.
```

## Sprint 0 Agent Boundary

Sprint 0 agents may create project foundation only.

Sprint 0 agents must not implement：

* Capture feature logic
* Viewer playback logic
* Compare sync logic
* Metrics calculation
* Production OAuth flow beyond placeholder / contract-ready structure

