# SPRINT_0_IMPLEMENTATION_BRIEF.md

---

| Item | Value |
| --- | --- |
| Sprint | Sprint 0 |
| Purpose | Repository / App Foundation Bootstrap |
| Status | Ready for AI Agent Implementation |
| Source | Patch 01 Cleanup Verification |
| Output Language | 中文 |

---

# 1. Sprint 0 Goal

Sprint 0 的目標是建立 Motion Capture Platform 的開發基礎，而不是實作產品功能。

Sprint 0 完成後，專案應具備：

- Monorepo structure
- Frontend app shell
- Backend app shell
- Docker Compose baseline
- Basic route shell
- Basic API health check
- RTK Query base setup
- Documentation / README baseline
- AI Agent 後續可安全接續開發的 folder structure

---

# 2. Explicit Non-goals

Sprint 0 不實作：

- Capture feature logic
- MediaRecorder
- MediaPipe integration
- Pose detection
- Motion Model calculation
- Metrics calculation
- Viewer playback logic
- Compare sync logic
- Annotation CRUD UI
- Dashboard charts
- Production Google OAuth flow
- GCS signed URL real integration
- Database schema / migration beyond placeholder setup

---

# 3. Required Context for AI Agent

AI Agent 開始 Sprint 0 前必須閱讀：

```text
00_MASTER_CONTEXT.md
02_PRODUCT_SPEC.md
03_SYSTEM_ARCHITECTURE.md
05_TECH_STACK_SPEC.md
13_FRONTEND_ARCHITECTURE.md
14_BACKEND_ARCHITECTURE.md
17_CODING_GUIDELINES.md
19_BACKLOG.md
20_AGENTS.md
```

若實作 health check / app shell 需要 API route context，另讀：

```text
12_API_SPEC.md
```

---

# 4. Allowed Changes

AI Agent 可建立：

```text
motion-capture-platform/
├── docs/
├── frontend/
├── backend/
├── docker/
├── scripts/
├── .github/
├── docker-compose.yml
└── README.md
```

Frontend 可建立：

```text
frontend/src/
├── app/
├── routes/
├── pages/
├── features/
├── engines/
├── services/
├── store/
├── components/
├── hooks/
├── types/
└── utils/
```

Backend 可建立：

```text
backend/app/
├── main.py
├── core/
├── api/
│   └── v1/
├── models/
├── schemas/
├── services/
├── repositories/
├── storage/
├── db/
└── tests/
```

---

# 5. Forbidden Changes

AI Agent 不得：

- 修改 Design Docs，除非使用者明確要求。
- 新增未批准第三方套件。
- 實作 Capture / Viewer / Compare / Dashboard 產品功能。
- 改變 folder structure。
- 讓 component 直接呼叫 `fetch`。
- 讓 engine 依賴 React / Redux / RTK Query。
- 讓 backend repository 依賴 router。
- 新增 Architecture Decision。

---

# 6. Implementation Tasks

## Task 1 — Repository Bootstrap

建立 monorepo 基礎結構。

Acceptance Criteria：

- Root folder structure matches `17_CODING_GUIDELINES.md`。
- `docs/` folder exists。
- `frontend/` and `backend/` folders exist。
- Root `README.md` exists。

---

## Task 2 — Frontend Bootstrap

建立 React app shell。

Acceptance Criteria：

- Frontend app can start locally。
- React Router route shell exists：
  - `/login`
  - `/dashboard`
  - `/capture`
  - `/records`
  - `/records/:recordId`
  - `/compare`
- Pages are shell only，no product logic。
- RTK Query base API module exists。
- Redux store baseline exists。

---

## Task 3 — Backend Bootstrap

建立 FastAPI app shell。

Acceptance Criteria：

- Backend app can start locally。
- `/api/health` or equivalent health check exists。
- `api/v1/router.py` structure exists。
- Router / Service / Repository folder boundary exists。
- No real motion analysis logic exists。

---

## Task 4 — Docker Baseline

建立 local development Docker baseline。

Acceptance Criteria：

- `docker-compose.yml` exists。
- Frontend service placeholder exists。
- Backend service placeholder exists。
- PostgreSQL service placeholder exists if needed for local startup。
- README includes local start instructions。

---

## Task 5 — Documentation / Agent Safety

建立基本 implementation notes。

Acceptance Criteria：

- README explains project purpose。
- README explains how to start frontend/backend。
- README states Sprint 0 does not implement product features。
- AI Agent guardrails are visible in implementation notes or README。

---

# 7. Definition of Done

Sprint 0 完成條件：

- [ ] Repository structure exists and matches approved docs。
- [ ] Frontend app starts locally。
- [ ] Backend app starts locally。
- [ ] Health check works。
- [ ] Route shell exists。
- [ ] RTK Query base setup exists。
- [ ] Redux store baseline exists。
- [ ] Docker Compose baseline exists。
- [ ] README exists with startup instructions。
- [ ] No Capture / Viewer / Compare product feature logic implemented。
- [ ] No unapproved architecture change introduced。
- [ ] No out-of-scope feature introduced。

---

# 8. Recommended AI Agent Prompt

```text
Context:
You are implementing Sprint 0 for the Motion Capture Platform.
Read the approved Design Docs before coding.
Sprint 0 is repository and app foundation only.

Goal:
Create the monorepo, frontend shell, backend shell, Docker baseline, route shell, health check, RTK Query base setup, Redux store baseline, and README.

Constraints:
- Do not implement Capture / Viewer / Compare / Dashboard feature logic.
- Do not integrate MediaPipe.
- Do not implement real Google OAuth.
- Do not implement real GCS upload.
- Do not change architecture or Design Docs.
- Follow the approved folder structure.

Acceptance Criteria:
- Frontend starts locally.
- Backend starts locally.
- Health check works.
- Route shell exists.
- Folder structure matches docs.
- README includes startup instructions.
- No product feature logic is implemented.
```

---

# 9. Next After Sprint 0

Sprint 0 完成後，建議先做：

```text
SPRINT_0_REVIEW.md
```

確認 foundation 是否符合 docs。

之後再進入：

```text
Patch 02 — Frontend Runtime / Component Contract
```

或：

```text
Sprint 1 — Capture Foundation
```

但正式產品功能實作前，建議先補 Patch 02。

