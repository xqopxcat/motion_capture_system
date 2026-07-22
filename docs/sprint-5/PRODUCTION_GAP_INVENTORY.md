# Sprint 5 Production Gap Inventory

Runtime locations below were inspected directly. “Removal” means removal from normal application runtime, not deletion of useful test doubles.

## Authentication

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Users | Module-global dict; fixed `user_demo`/`user_dev` identities | `backend/app/repositories/user_repository.py`, `runtime_repositories.py` | `CurrentUser`; `UserRepository.get/get_or_create_demo_user` | Not durable; hard-coded identity/profile; no provider subject uniqueness | 59–61 | High | auth plus all owned-resource tests | Bind persistent repo in 60; demo creation test-only in 61 |
| Sessions | Module-global dict of opaque IDs; no expiry | `session_repository.py`, `runtime_repositories.py` | HttpOnly cookie → `/me`, logout | Restart logs everyone out; no expiry/revocation metadata/security lifecycle | 59–61 | High | `test_auth.py`, frontend auth tests | Persistent binding in 60; production policy in 61 |
| Google/dev login | Both buttons call `/auth/mock-login`; no Google API | `api/v1/auth.py`, `auth_service.py`, `LoginPage.tsx`, `authApi.ts` | `MockLoginRequest/Response`, provider union | Google label is a mock; mock route always available | 61/64 | Critical | backend/frontend auth and route tests | Production mock route disabled in 61; UI replaced in 64 |
| Cookie | Always `secure=False`, `samesite=lax`; no max-age/domain/env policy | `api/v1/auth.py` | backend-owned cookie | Unsafe/incomplete for deployed origin; CSRF architecture undecided | 61 | High | auth/security integration tests | 61 |

## Persistence

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime binding | Six repositories instantiated as process singletons | `backend/app/repositories/runtime_repositories.py` | Services default to these objects | All state restart-sensitive; test/application state shared | 59/60 | Critical | nearly all backend tests | 60 after schema/migrations |
| Database config | Optional `database_url`; Compose provides PostgreSQL | `core/config.py`, `docker-compose.yml` | Configuration only | URL unused; no driver, models, migration tool, pool or health check | 59/60 | Critical | health, startup, repository integration | 59–60 |
| Records | Dict with title/description/tags/status/created only | `record_repository.py` | create/get/list/update status | No updated/lifecycle/failure metadata, constraints, transactions | 59/60 | High | records/dashboard/upload/annotation | 60 |
| Artifacts | Append-only list of completion records | `artifact_repository.py` | mark/get/has completed | Duplicates allowed; no content metadata, owner, checksum, cleanup, FK | 59/60/62 | Critical | upload/record tests | persistence in 60; storage semantics 62 |
| Metric Summary | One dict entry per Record, overwritten | `metric_summary_repository.py` | persist/get/get_summaries | No DB constraints/version migration/transaction with artifact completion | 59/60/63 | High | upload/records/dashboard | 60–63 |
| Annotations | Dict CRUD | `annotation_repository.py` | annotation service CRUD | Restart loss; no FK/delete policy; author ownership relies on service | 59/60 | High | annotation tests | 60 |

## Storage

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Signed URLs | String builder returns `https://mock-storage.local/...` | `storage/signed_url_service.py` | `SignedUploadUrlResponse`; URLs in Record responses | No signature/provider/auth/existence; expiry is metadata only | 62 | Critical | upload/records plus frontend loaders | 62 |
| Canonical paths | Server helper covers all four artifact types | `storage/storage_paths.py` | returned `storagePath`; completion path validation | No user namespace, collision/provider policy, or path-to-object verification | 62 | High | upload path tests | Harden in 62 while preserving returned-path ownership |
| Upload completion | Trusts client path and immediately records Complete | `upload_service.py` | `/uploads/*/complete` | Does not HEAD object, validate size/type/checksum, handle duplicate/partial upload | 62/63 | Critical | upload/finalize tests | 62–63 |
| Download authorization | Record ownership checked before URL creation | `record_service.py` | owned Record detail/list | Fake URL; no storage IAM, expiry refresh, object existence, cleanup | 62 | High | records/viewer/compare | 62 |
| GCS provider | No cloud storage dependency or adapter exists | `requirements.txt`, `backend/app/storage/*` | signed URL and canonical path abstractions | Production provider is now locked to private GCS but is not implemented/configured | 62 | Critical | storage contract, startup, production-like smoke | 62 |
| Record object cleanup | No Record delete API and no object deletion behavior | Records API/service and storage layer | none | Required Production MVP deletion cannot remove Video/Pose/Metrics/Thumbnail or report partial failure | 59/60/62/63/64 | Critical | delete authorization, FK/GCS cleanup, UI/E2E | 59–64 |

## Record lifecycle

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Creation | Creates `Uploading` Record | `record_repository.py`, `record_service.py` | `POST /records` | Not durable; no lifecycle timestamps | 59/60 | High | records/upload | 60 |
| Finalization | Checks four completion flags + summary; directly sets Ready; missing requirement permanently sets Failed | `record_service.py` | `POST /records/{id}/complete` | `Processing` unused; no transition guard, idempotency, timeout, retry, rollback or failure metadata | 63 | Critical | record lifecycle/frontend orchestration | 63 |
| Processing boundary | Status exists only in schema/tests | `schemas/record.py` | status union | No actual processing; browser/backend boundary undocumented in runtime | 63 | High | records/dashboard/compare/UI | 63 |
| Transaction | Artifact, summary, status writes are independent | upload/record services and repositories | service calls | Partial state on failure; duplicate finalize behavior undefined | 60/63 | Critical | upload/finalize integration | 60/63 |

## Ownership and authorization

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Records | Service calls `get_owned/list_owned/is_owned_by`; unauthorized looks missing | record/upload/annotation services | 404 non-disclosure semantics | Filtering occurs over process dict, not DB predicates; no storage-level owner | 60/62 | High | cross-user backend tests | 60/62 |
| Annotations | Record ownership checked before annotation access | `annotation_service.py` | owned Record 404 | Annotation query itself is not owner-scoped; persistent query must prevent race/leak | 60 | Medium | annotation cross-user tests | 60 |
| Dashboard | Loads owned Records then summaries by IDs | `dashboard_service.py` | `/dashboard/summary` | Python aggregation; needs owner-scoped durable query and scale-safe plan | 60 | Medium | dashboard ownership/trend tests | 60 |

## Metrics

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Summary compatibility | Fields and five-part Dashboard key already exist | upload schemas/repository/dashboard service | `metricDefinitionVersion`, unit, activityType, side | Nullable compatibility fields make trends unavailable; DB constraints/index policy missing | 59/60/63 | High | metrics upload/dashboard | 59–63 |
| Metric Series | Browser-generated artifact contract; mock URL loader returns null | `useMetricSeriesLoader.ts` | Record Detail `metrics.seriesUrl` | No real bytes uploaded/loaded in application path | 62/64 | Critical | compare loaders and upload E2E | 62/64 |
| Metrics Engine | No full calculation/upload orchestration in current frontend | Capture code and placeholder upload hook | artifact/schema boundaries only | Production wiring must not be mistaken for authorization to build backend Metrics Engine | 64 (wiring only) | High scope risk | capture/upload E2E | Lock remains throughout Sprint 5 |

## Annotation

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime CRUD | API-backed for real Record; dict-backed on server | annotation page/service/repository | CRUD schemas/routes | Non-persistent and no DB FK/index/delete policy | 59/60 | High | annotation backend/frontend | 60 |
| Local annotations | Viewer creates local fixture markers and local-only mutations | `RecordViewerPage.tsx` | `local-demo` path | Application-accessible fallback bypasses auth/persistence | 64 | Medium | Viewer component/fixture tests | Isolate to tests in 64 |

## Dashboard

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Counts/trends | Correctly derived from global in-memory repositories and compatibility key | `dashboard_service.py` | `DashboardSummaryResponse` | Restart loss; Python scan; no production aggregate query/transactional snapshot | 60 | High | dashboard backend/frontend | 60 |
| Recent Records | Uses API Record list; no demo seed observed | `DashboardPage.tsx`, `recordsApi.ts` | list records | Depends on non-persistent backend; upload route never creates data from UI | 60/64 | High | Dashboard page/state | 60/64 |

## Compare

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime loading | Uses owned Record Detail and fetches pose/metric URLs | `useCompareRecordRuntime.ts` | existing Records API | Pose loader substitutes fixture for mock URL; metric loader returns null for mock URL | 62/64 | Critical | compare runtime/loader tests | Real storage in 62; fallback isolated in 64 |
| Video/artifacts | Browser consumes signed URLs | Compare layout/runtime | Record Detail fields | Fake provider URLs cannot load; expiry/retry behavior absent | 62/64 | High | Compare E2E | 62/64 |

## Frontend integration

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Capture | Records local Blob and Pose draft only | `CapturePage.tsx`, `useCapturePipeline.ts` | local browser state | No title/metadata flow, Record creation, artifacts, summary, upload, finalize, status navigation | 64 | Critical | Capture/upload E2E | 64 |
| Upload hook | Constant idle state and TODO | `useRecordUploadPipeline.ts` | `UploadRuntimeState` | Placeholder; RTK endpoints exist but are not orchestrated; no actual PUT to signed URL | 64 | Critical | new hook/integration tests | 64 |
| Viewer fixture route | `local-demo`, `poseFixture`, arbitrary `videoUrl` query fallback | Viewer loader/page/fixtures | local artifact loader state | Runtime-accessible hard-coded fixture and placeholder video | 64 | High | Viewer loader/page tests | Test-only in 64 |
| Pose mock fallback | Mock download URL returns local Pose fixture | `usePoseLoader.ts` | pose URL loader | Hides missing object storage | 64 | Critical | Viewer/Compare loader tests | 64 after 62 |
| Metric mock fallback | Mock metrics URL silently returns null | `useMetricSeriesLoader.ts` | metric URL loader | Hides missing Metric Series | 64 | Critical | Compare/runtime tests | 64 after 62 |
| Thumbnail | Deliberately refuses to render mock URL | `RecordsPage.tsx` | `thumbnailUrl` | Placeholder presentation hides fake storage | 64 | Medium | Records UI | 64 after 62 |
| Auth UI | Google/dev buttons both use mock mutation | Login page/auth API | mock-login endpoint | Production login is not OAuth | 61/64 | Critical | auth UI/API tests | 64 after 61 |

## Configuration

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend settings | Minimal settings; extra env ignored | `core/config.py` | `.env`/environment | No `APP_ENV`, adapter selection, credentials, security or fail-fast validation | 59–62 | Critical | startup/config tests | Incrementally 59–62 |
| Frontend API | `.env` localhost; fallback `/api` | `.env`, `baseApi.ts`, Compose | `VITE_API_BASE_URL` | No explicit production validation/diagnostics | 64 | Medium | build/config smoke | 64 |
| Dependencies | FastAPI/uvicorn/settings only | `requirements.txt` | Python runtime | No PostgreSQL/migration/cloud/OAuth libraries | 59/61/62 | High | build/startup | Add only in owning tasks with approval |

## Tests and fixtures

| Area | Current implementation | Runtime location | Current interface/contract | Production gap | Task | Risk | Tests affected | Removal timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend API tests | TestClient calls mock login and shared module singletons; no global reset fixture found | `backend/app/tests/*` | API behavior | Order/state leakage risk; no DB/storage/auth integration boundary | 59–63 | High | all backend tests | Refactor alongside 59–63 |
| Frontend fixtures | Inline records, local Viewer Pose/video/annotations, mock URL strings | `*.test.ts(x)`, Viewer fixture modules | unit/component test inputs | Legitimate tests are mixed with application-accessible fallback | 64 | High | Viewer/Compare/Dashboard tests | Keep injected test data; remove runtime reachability in 64 |
| E2E/restart | No E2E framework or restart persistence suite observed | repository | none | Full Production MVP remains unverified | 65 | Critical | new validation suite/checklist | 65 |

## No Seed-data Finding

No database seed script, Dashboard demo seed, production seed, or UI test-data button was found. The fixed demo/dev identities and Viewer local fixture are runtime mocks, not an acceptable seed strategy. Sprint 5 permits a new, explicit CLI fixture/seed only when it is environment-guarded to `local` or `test`, deliberately invoked, deterministic where tests require it, and unable to run against production or production-like configuration. Runtime/demo/production seed and UI test-data controls remain forbidden.
