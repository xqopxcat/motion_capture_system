# Sprint 0 Review

| 項目 | 內容 |
| --- | --- |
| Sprint | Sprint 0 |
| 目的 | Repository / App Foundation Bootstrap Review |
| 狀態 | Reviewed |
| 範圍 | Foundation only |

---

## 1. Sprint 0 Summary

Sprint 0 已完成 Motion Capture Platform monorepo 的基礎建置。

本次完成內容包含 React 前端應用程式外殼、FastAPI 後端應用程式外殼、Docker Compose 本機開發基線、必要的前後端資料夾邊界、前端 route shell pages、後端 health check endpoint、RTK Query base setup、Redux store baseline，以及 README 啟動說明。

Sprint 0 明確不實作任何產品功能邏輯。

---

## 2. Implemented Scope

已完成的 Sprint 0 foundation scope：

- Monorepo baseline。
- Frontend React app shell。
- Backend FastAPI app shell。
- Docker Compose baseline。
- MVP routes 的前端 route shell。
- 後端 `/api/health` health check endpoint。
- `api/v1/router.py` 後端 router structure。
- 可見的後端 Router / Service / Repository 邊界。
- RTK Query base API setup。
- Redux store baseline。
- README，包含啟動說明與 AI agent guardrails。
- `.gitignore` 與 `.gitattributes` repository hygiene files。

---

## 3. Verification Checklist

| 檢查項目 | 結果 |
| --- | --- |
| Repository structure matches approved docs. | Pass |
| Frontend app starts locally. | Pass |
| Backend app starts locally. | Pass |
| `/api/health` works. | Pass |
| Route shell exists. | Pass |
| RTK Query base setup exists. | Pass |
| Redux store baseline exists. | Pass |
| Docker Compose baseline exists. | Pass |
| README exists with startup instructions. | Pass |
| No Capture / Viewer / Compare product feature logic implemented. | Pass |
| No unapproved architecture change introduced. | Pass |
| Existing design docs were not modified. | Pass |

---

## 4. Commands Used for Verification

前端驗證：

```powershell
cd frontend
npm install
npm run build
npm run dev
```

後端驗證：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check 驗證：

```powershell
curl http://localhost:8000/api/health
```

預期 health response：

```json
{"status":"ok"}
```

Repository review commands：

```powershell
git status --short
rg --files
```

---

## 5. Confirmed Non-goals

已確認 Sprint 0 沒有實作：

- Capture feature logic。
- MediaRecorder integration。
- MediaPipe integration。
- Pose detection。
- Motion Model calculation。
- Metrics calculation。
- Viewer playback logic。
- Compare sync logic。
- Annotation CRUD UI。
- Dashboard charts。
- Production Google OAuth flow。
- Real GCS signed URL integration。
- Database schema or migration beyond placeholder setup。
- Route placeholders 以外的任何產品功能實作。

---

## 6. Known Limitations

- Route pages 目前都是 placeholders。
- Backend 目前唯一實作的 API endpoint 是 health check。
- PostgreSQL 已放入 Docker Compose 作為本機 baseline service，但尚未實作 database schema 或 migration。
- Authentication、storage、upload、records、annotations、dashboard、viewer、compare、capture functionality 都保留給後續 Sprint。
- Docker 是否可用取決於本機開發環境是否已安裝 Docker。

---

## 7. Recommendation for Next Step

建議下一步：

```text
Patch 02 — Frontend Runtime / Component Contract
```

建議先完成 Patch 02，再進入 Sprint 1 Capture implementation。這樣可以在產品功能開發前，先明確定義 runtime ownership、component contracts、controller boundaries，以及 feature integration rules。
