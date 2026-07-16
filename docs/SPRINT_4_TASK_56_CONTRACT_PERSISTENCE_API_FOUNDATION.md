# Sprint 4 Task 56 — Metric Summary Trend Foundation

---

| Item | Value |
| --- | --- |
| Document | SPRINT_4_TASK_56_CONTRACT_PERSISTENCE_API_FOUNDATION.md |
| Sprint | Sprint 4 — Dashboard |
| Task | Task 56 — Metric Summary Trend |
| Increment | Contract / Persistence / API Foundation |
| Status | Implemented; Trend UI Not Started |
| Last Updated | 2026-07-17 |

---

# 1. Scope

This Task 56 increment establishes the minimum compatibility-safe data path required before implementing Metric Summary Trend UI.

Implemented:

* backward-compatible Metric Summary compatibility metadata;
* compatibility metadata persistence;
* batch summary repository read;
* owned Dashboard Summary API;
* exact compatibility grouping;
* backend and frontend API types;
* focused contract, ownership, persistence, and grouping tests.

Not implemented:

* Dashboard trend/chart UI;
* metric selector UI;
* chart dependency;
* Task 57 state orchestration;
* Video, Pose, Metric Series, Viewer runtime, or Compare runtime loading.

# 2. Compatibility Metadata

Metric Summary items now accept and persist these optional fields:

```text
unit
metricDefinitionVersion
activityType
side
```

The fields are optional at upload/persistence boundaries to preserve existing/legacy Record finalization and Viewer behavior.

An item is eligible for a cross-Record Dashboard trend only when all compatibility values are non-empty:

```text
metricId
unit
metricDefinitionVersion
activityType
side
```

Missing compatibility metadata is never inferred from Record title, description, tags, artifact version, or other free text. Incomplete items remain usable as per-Record summaries but are excluded from trends.

# 3. Persistence

`MetricSummaryItemRecord` persists:

* existing `metric_id`, min, max, average, and range of motion;
* unit;
* metric definition/calculation compatibility version;
* activity type;
* side.

`UploadService.complete_metrics_upload` maps compatibility fields from the validated upload request into structured Metric Summary persistence.

Record Detail exposes the same nullable fields for contract consistency without changing Viewer behavior.

# 4. Batch Repository Boundary

`MetricSummaryRepository.get_summaries(record_ids)` retrieves summaries for a bounded owned Record ID collection in one repository call.

Dashboard Service does not call Record Detail and does not issue per-Record HTTP requests. The batch boundary avoids a service/repository N+1 access pattern and never loads Metric Series artifacts.

# 5. Dashboard API Contract

Endpoint:

```http
GET /api/dashboard/summary
```

Authentication and ownership:

* existing backend session authentication is required;
* Record ownership is applied before counts, summary lookup, or trend grouping;
* another user's Record or Metric Summary cannot contribute counts or points;
* frontend filtering is not used as authorization.

Response sections:

```text
counts
metricTrends
```

Counts follow the existing Task 55 definitions. The current Dashboard UI continues using its shared Record List query; this API foundation does not rewire Task 55 UI.

# 6. Trend Rules

* Only `Ready` Records contribute points.
* Only fully populated compatibility keys contribute points.
* Exact compatibility-key matches form one series.
* Different units, metric versions, activities, or sides always form separate series.
* MVP statistic is explicitly `average`.
* Point value is the stored per-Record Metric Summary `average`; the backend performs no new Metrics Engine calculation.
* Points are ordered by `createdAt` ascending.
* Zero- and one-point series remain valid API data so the later UI can apply the locked empty/single-point behavior.
* Missing values are omitted and never converted to zero.
* Response contains no signed URLs or runtime artifact fields.

# 7. Backend Components

Created:

* `backend/app/schemas/dashboard.py`
* `backend/app/services/dashboard_service.py`
* `backend/app/api/v1/dashboard.py`
* `backend/app/tests/test_dashboard.py`

Modified:

* `backend/app/api/v1/router.py`
* `backend/app/schemas/upload.py`
* `backend/app/schemas/record.py`
* `backend/app/services/upload_service.py`
* `backend/app/services/record_service.py`
* `backend/app/repositories/metric_summary_repository.py`
* `backend/app/tests/test_uploads.py`

# 8. Frontend Contract Foundation

Created:

* `frontend/src/types/dashboard.ts`
* `frontend/src/services/dashboardApi.ts`
* `frontend/src/services/dashboardApi.test.ts`

Modified:

* `frontend/src/types/index.ts`
* `frontend/src/types/upload.ts`
* `frontend/src/types/record.ts`
* `frontend/src/services/uploadsApi.test.ts`

`dashboardApi` defines one RTK Query endpoint for `/dashboard/summary`, but Dashboard UI does not call the hook in this foundation increment.

# 9. Tests

Backend coverage includes:

* Dashboard endpoint requires authentication;
* endpoint response contract;
* owned-only counts and points;
* Ready-only trend points;
* incomplete compatibility metadata exclusion;
* exact compatible grouping;
* separation by unit, version, activity, and side;
* chronological point order;
* compatibility metadata upload persistence;
* existing upload and Record behavior regression.

Frontend coverage includes:

* Dashboard Summary RTK Query endpoint registration;
* compatibility-safe response typing;
* upload request compatibility metadata typing;
* existing Dashboard/Record/UI regression through the full suite.

# 10. API and Runtime Boundaries

Confirmed request behavior:

* one Dashboard Summary HTTP request can return all trend groups;
* no Record Detail request;
* no per-Record HTTP request;
* no Metric Series request;
* no Video or Pose request;
* no Viewer or Compare runtime loader;
* no N+1 request pattern.

Validation results:

```text
Backend:  67 passed
Frontend: 31 test files passed, 154 tests passed
Build:    tsc -b and vite build passed
```

Backend pytest emitted a cache-write warning for the existing `.pytest_cache` path; all tests passed. Vite emitted the existing bundle-size advisory; the build passed and this increment added no dependency. There is no separate frontend lint script.

# 11. Known Limitations

* Repositories remain in-memory in the current implementation environment, although the service/repository contract is ready for structured database persistence.
* Legacy summaries without complete compatibility fields do not appear in trend results.
* Activity type and side are provided by the summary producer; no authoritative activity registry or side enum exists yet.
* The API currently exposes only the `average` statistic.
* The API returns all compatible owned Ready history without pagination or time-range filtering.
* Task 55 UI still derives counts from the Record List query; consolidating Dashboard UI requests is a later integration decision and is not required for this foundation.

# 12. Readiness for Task 56 Trend UI

The contract, persistence, ownership, and aggregation foundation is ready for the next Task 56 increment: Metric Summary Trend presentation.

Before UI implementation, the product must select the initial fixed metric/compatibility series or define the selector behavior when the API returns multiple exact-compatible series. No chart or selector has been started automatically.
