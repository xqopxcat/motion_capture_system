# 17_CODING_GUIDELINES.md

# Motion Capture Platform - Coding Guidelines

---

| Item         | Value                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Document     | 17_CODING_GUIDELINES.md                                                                              |
| Version      | 1.0                                                                                                  |
| Status       | Draft                                                                                                |
| Owner        | MengJu Lee                                                                                           |
| Last Updated | 2026-06-26                                                                                           |
| Depends On   | 05_TECH_STACK_SPEC.md、13_FRONTEND_ARCHITECTURE.md、14_BACKEND_ARCHITECTURE.md、16_UI_COMPONENT_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的開發規範（Coding Guidelines）。

本文件適用於：

* Human Developers
* Codex
* Cursor
* Claude Code
* Gemini
* GitHub Copilot
* 未來所有 AI Agents

目的：

* 維持一致程式風格
* 維持 Architecture Integrity
* 降低 Code Review 成本
* 提高 AI 自動生成程式品質

---

# 2. Development Principles

整個專案遵循：

* Readability First
* Simplicity
* Composition over Inheritance
* Single Responsibility
* Explicit over Implicit
* Feature-based Architecture
* Engine Isolation

任何 Code：

優先：

Maintainability。

不是：

Shortest Code。

---

# 3. Repository Structure

Repository 採 Monorepo。

```text
motion-capture-platform/

├── docs/
│
├── frontend/
│
│   ├── src/
│   │
│   ├── public/
│   │
│   └── package.json
│
├── backend/
│
│   ├── app/
│   │
│   ├── tests/
│   │
│   └── requirements.txt
│
├── docker/
│
├── scripts/
│
├── .github/
│
├── docker-compose.yml
│
└── README.md
```

所有設計文件統一放置：

```text
docs/
```

不得放置於 frontend 或 backend。

---

# 4. Frontend Structure

Frontend 採 Feature-based Architecture。

```text
frontend/src/

app/

routes/

pages/

features/

engines/

services/

store/

components/

hooks/

types/

utils/
```

不得建立：

```text
common/

misc/

shared2/

helpers2/
```

等模糊命名。

---

# 5. Backend Structure

Backend 採：

Router

↓

Service

↓

Repository

↓

Database

禁止：

Router

↓

SQL

---

# 6. Naming Convention

## Files

React Component：

```text
MetricPanel.tsx
```

Hook：

```text
usePlayback.ts
```

Utility：

```text
calculateAngle.ts
```

CSS：

```text
MetricPanel.module.css
```

---

## Variables

camelCase

例如：

```javascript
currentFrame

selectedJoint

playbackSpeed
```

---

## Components

PascalCase

例如：

```text
Timeline

MetricPanel

AnnotationDrawer
```

---

## Constants

UPPER_SNAKE_CASE

例如：

```javascript
DEFAULT_FPS

MAX_UPLOAD_SIZE
```

---

# 7. React Guidelines

Component 應：

* Functional Component
* Hooks Only

禁止：

* Class Component

每個 Component：

僅負責一件事情。

---

# 8. Component Guidelines

Component：

不應：

直接呼叫 API。

應：

由：

RTK Query Hook

提供資料。

---

Component：

不應：

計算 Metrics。

應：

由：

Metrics Engine

提供。

---

# 9. Engine Guidelines

Engine：

不得依賴：

* React
* Redux
* RTK Query
* Pages
* Features

Engine：

應保持：

Pure TypeScript / JavaScript。

可獨立測試。

---

# 10. Redux Guidelines

Redux

只保存：

UI State。

例如：

* Current Frame
* Playback
* Selected Joint
* Compare Offset

不得保存：

* Pose Dataset
* Motion Model
* Metric Series

上述資料由：

Engine

或

RTK Query

管理。

---

# 11. RTK Query Guidelines

Server State：

全部交由 RTK Query。

不得：

自行：

```javascript
fetch(...)
```

不得：

Axios Singleton。

所有 API：

建立於：

```text
services/
```

---

# 12. Styling Guidelines

採：

CSS Modules。

命名：

```text
Timeline.module.css
```

禁止：

Inline Style（除特殊情況）。

---

# 13. TypeScript Guidelines

新開發 Module：

優先：

TypeScript。

尤其：

* Engines
* Types
* API Models
* Utilities

Legacy JavaScript：

可逐步遷移。

---

# 14. Error Handling

所有 Error：

不得：

```javascript
console.log(error)
```

應：

* Throw Error
* Return Error Result
* 顯示 User-friendly Message

---

# 15. Testing Guidelines

每個 Engine：

至少：

Unit Test。

未來：

* Vitest
* React Testing Library
* Pytest

---

# 16. Git Guidelines

Branch：

```text
feature/

bugfix/

refactor/

docs/
```

Commit：

建議：

Conventional Commit。

例如：

```text
feat:

fix:

refactor:

docs:

test:
```

---

# 17. Architecture Rules

禁止：

Page

↓

Engine

↓

Page

循環依賴。

---

Engine：

不可依賴：

UI。

---

Component：

不可依賴：

Business Logic。

---

Repository：

不可依賴：

Router。

---

# 18. AI Agent Rules

所有 AI Agent：

不得：

* 修改 Design Docs
* 修改 Architecture
* 修改 API Contract

除非：

User 明確要求。

---

AI Agent：

新增功能時：

優先：

遵循：

已有 Folder Structure。

不得：

自行新增：

```text
helpers2/

misc/

temp/

new_components/
```

---

AI Agent：

不得：

建立重複 Component。

應：

優先搜尋：

是否已有可重用 Component。

---

# 19. Code Review Checklist

新增程式前：

確認：

* 是否符合 Folder Structure？
* 是否已有可重用 Component？
* 是否已有可重用 Hook？
* 是否已有 Utility？
* 是否已有 Engine？
* 是否已有 RTK Query Endpoint？

避免：

重複實作。

---

# 20. Design Decisions

* 採 Feature-based Architecture。
* Engine 與 UI 分離。
* RTK Query 管理 Server State。
* Redux 僅管理 UI State。
* CSS Modules。
* JavaScript + TypeScript 漸進式導入。
* AI Agent 必須遵循本文件。

---

# 21. Related Documents

Depends On

* 05_TECH_STACK_SPEC.md
* 13_FRONTEND_ARCHITECTURE.md
* 14_BACKEND_ARCHITECTURE.md
* 16_UI_COMPONENT_SPEC.md

Related

* 18_DECISION_LOG.md
* 20_AGENTS.md

---

# 22. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# Patch 1 Addendum — Implementation Guardrails for Critical Contracts

Status: Patch 1 Applied  
Source: SPEC_PATCH_PLAN_01_CRITICAL_ITEMS.md

## Upload / Storage Guardrails

* Upload path must be generated by Backend Storage Layer.
* Frontend must not invent official storage path.
* Upload completion must go through API complete endpoints.
* API contract changes require Design Doc update first.

## Dependency Guardrails

Forbidden：

* Engine imports React / Redux / RTK Query.
* Component directly calls `fetch`.
* Repository depends on Router.
* Storage Layer handles Record business rules.
* Pose Dataset or Metric Series stored in Redux.

## AI Agent Guardrails

AI Agent must not implement a task unless：

* Scope is explicit.
* Allowed files or folders are explicit.
* Acceptance Criteria are explicit.
* Forbidden changes are explicit.

