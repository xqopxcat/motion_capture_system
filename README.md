# Motion Capture Platform

Sprint 0 建立 Motion Capture Platform 的儲存庫與應用程式基礎。

本 Sprint 刻意不實作產品功能。目前沒有 Capture 邏輯、MediaRecorder 整合、MediaPipe 整合、姿態偵測、Motion Model 計算、Metrics 計算、Viewer 播放、Compare 同步、Dashboard 圖表、正式 Google OAuth，或真實 GCS signed URL 整合。

## 專案結構

```text
frontend/          React 應用程式外殼
backend/           FastAPI 應用程式外殼
docker/            Docker 開發環境檔案
scripts/           專案輔助腳本
docker-compose.yml 本機開發服務
docs/              已核准的設計文件
```

## 啟動前端

```bash
cd frontend
npm install
npm run dev
```

前端會執行在 `http://localhost:5173`。

## 啟動後端

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

後端會執行在 `http://localhost:8000`。

## 測試 Health Check

```bash
curl http://localhost:8000/api/health
```

預期回應：

```json
{"status":"ok"}
```

## Docker Compose

```bash
docker compose up --build
```

服務：

- 前端：`http://localhost:5173`
- 後端：`http://localhost:8000`
- PostgreSQL: `localhost:5432`

## Sprint 0 AI Agent Guardrails

- 未經明確核准，不得修改設計文件。
- Sprint 0 僅限於儲存庫與應用程式基礎建置。
- 不得實作 Capture、Viewer、Compare、Dashboard、motion analysis、正式 auth 或 storage integrations。
- 前端 component 不得直接呼叫 `fetch`；API 存取必須放在 RTK Query services。
- Engines 不得依賴 React、Redux 或 RTK Query。
- Backend routers 必須呼叫 services；repositories 不得依賴 routers。
- API 或架構變更必須先經過設計文件核准，才能實作。

