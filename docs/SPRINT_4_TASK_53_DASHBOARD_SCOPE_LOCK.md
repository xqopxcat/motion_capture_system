# Sprint 4 Task 53 — Dashboard Scope Lock

---

| Item | Value |
| --- | --- |
| Document | SPRINT_4_TASK_53_DASHBOARD_SCOPE_LOCK.md |
| Sprint | Sprint 4 — Dashboard |
| Task | Task 53 — Dashboard Scope Lock |
| Status | Scope Locked; Task 54 Ready |
| Last Updated | 2026-07-17 |

---

# 1. Purpose and Scope Boundary

This document locks the Dashboard MVP scope before implementation begins.

The locked Sprint 4 sequence remains:

```text
Task 53 — Dashboard Scope Lock
Task 54 — Recent Records
Task 55 — Summary Cards
Task 56 — Metric Summary Trend
Task 57 — Dashboard Empty / Loading / Error States
```

Dashboard may use only:

* Record Metadata
* Metric Summary

Dashboard must not load:

* Video files or signed video URLs
* Pose data or signed Pose Dataset URLs
* Per-frame Metric Series or signed Metric Series URLs
* Full Viewer runtime data
* Full Compare runtime data

This task changes documentation only. It does not implement Dashboard UI, API, service, repository, or Sprint 4 Tasks 54–57.

# 2. Fact and Decision Labels

The following labels are used throughout this document:

* **Confirmed** — directly observed in the current repository.
* **Locked** — implementation decision established by Task 53.
* **Gap** — required capability not currently implemented or not represented by the current contract.
* **Deferred** — intentionally left for the named later Sprint 4 task.

# 3. Current Repository Findings

## 3.1 Authentication and Routing

**Confirmed:**

* `/` redirects with `replace` to `/dashboard`.
* `/dashboard` is the authenticated landing route.
* `/login` is public.
* `/dashboard`, `/capture`, `/records`, `/records/:recordId`, and `/compare` are children of `ProtectedRoute`.
* `ProtectedRoute` calls `GET /api/me` through RTK Query. It shows a session-checking state while loading and redirects unauthenticated users to `/login?redirectTo=...`.
* Login accepts a safe internal `redirectTo`; otherwise it navigates to `/dashboard` with `replace`.
* Logout clears the backend session, resets RTK Query state, and navigates to `/login` with `replace`.
* `DashboardPage` is currently a `PageShell` placeholder and loads no product data.
* The current application has no `AppLayout`, Sidebar, Header navigation, or primary navigation links. The only global element inside the protected boundary is `AuthStatus`.

**Locked:**

* `/dashboard` remains the authenticated landing route and remains protected by the existing `ProtectedRoute`.
* Dashboard must preserve safe login return intent and the existing logout redirect.
* Dashboard must not introduce a second authentication or ownership mechanism.

## 3.2 Record APIs and Frontend Contract

**Confirmed existing endpoints:**

| Method | Path | Current use |
| --- | --- | --- |
| `POST` | `/api/records` | Create an owned Record in `Uploading` status |
| `GET` | `/api/records` | List the authenticated user's Record Metadata |
| `GET` | `/api/records/{recordId}` | Get owned Record detail; Ready responses include runtime artifact URLs and Metric Summary |
| `POST` | `/api/records/{recordId}/complete` | Validate required artifacts and Metric Summary, then finalize as `Ready` or fail |

**Confirmed `RecordListItem` response fields:**

```text
recordId: string
title: string
description: string
thumbnailUrl: string | null
duration: number | null
status: Uploading | Processing | Ready | Failed
tags: string[]
createdAt: string
```

**Confirmed behavior:**

* `GET /api/records` returns `{ items, total }`.
* The repository sorts owned Records by `createdAt` descending.
* The implemented endpoint accepts no query parameters. The design API spec mentions `search`, `tag`, `sort`, `page`, and `pageSize`, but these are not implemented by the router, service, frontend query, or repository.
* There is no implemented filter, pagination, limit, or alternate sort.
* Record List does not include Metric Summary.
* Record List may include a thumbnail signed URL. Dashboard must not require or fetch the underlying image for its MVP data contract; lightweight display of an already-returned URL is optional for Task 54.
* `duration` is present in the schema but the current service always returns `null`.
* Backend ownership filtering occurs in `list_owned(user.userId)`.
* Record detail and finalization use `get_owned`; another user's Record is returned as `404 RECORD_NOT_FOUND`.

## 3.3 Record Status Contract

**Confirmed canonical persisted values:**

| Status | Repository meaning | Current implementation behavior |
| --- | --- | --- |
| `Uploading` | Record exists and required artifacts are being uploaded | Initial status created by `POST /api/records` |
| `Processing` | Persisted processing stage between upload and Ready | Defined in schemas/specs; no current service transition writes it |
| `Ready` | Required artifacts and Metric Summary passed finalization | Written only after successful finalization |
| `Failed` | Uploading/Processing/finalization failure | Current finalization writes it when requirements are missing |

`Recording` and `Saving` are not persisted Record statuses.

**Confirmed navigation eligibility:**

* Viewer runtime data loads only when Record status is `Ready`.
* Compare selection and analysis accept only two distinct `Ready` Records.
* The current Records page renders an `Open` link for every non-empty Record ID, including non-Ready Records. `/records/:recordId` can display a non-Ready Record without loading runtime artifact URLs.

**Locked:**

* Only `Ready` is a Viewer-open status.
* Only `Ready` may be selected in Compare.
* Dashboard must handle unknown future status strings defensively in presentation, but it must not redefine the backend enum.

## 3.4 Metric Data

**Confirmed Metric Summary schema at upload, persistence, backend detail, and frontend detail boundaries:**

```text
metricId: string
min: finite number
max: finite number
average: finite number
rangeOfMotion: finite number >= 0
```

Upload validation requires:

* a non-empty `metricId`;
* at least one summary item;
* finite numeric values;
* `max >= min`;
* `rangeOfMotion >= 0`.

**Confirmed storage and retrieval:**

* Metric Summary is persisted as structured repository data keyed by `recordId`.
* The repository implementation is currently process-memory, although the approved architecture specifies PostgreSQL for MVP persistence.
* Metric Summary is written during `POST /api/uploads/metrics/complete`.
* Metric Summary is read through `MetricSummaryRepository.get_summary(recordId)`.
* It is returned to the frontend only inside `GET /api/records/{recordId}` at `metrics.summary`, and only for a `Ready` Record.
* The same detail response also exposes `metrics.seriesUrl`; Dashboard is forbidden from using this endpoint because it crosses the Dashboard data boundary and would create N+1 requests.
* No standalone Metric Summary endpoint exists.
* `GET /api/dashboard/summary` is documented in `12_API_SPEC.md`, but it is not implemented or registered in the backend router and has no frontend service.

**Confirmed Metric Series boundary:**

* Metric Series is a versioned storage artifact (`metric-series.v1.json`) containing per-frame values.
* It is loaded by Viewer/Compare runtime hooks.
* It must never be requested, parsed, or used by Dashboard.

## 3.5 Metric Keys, Units, Versions, and Fixtures

**Confirmed:**

* Repository tests and examples use `knee_flexion`.
* Design documents mention examples such as knee flexion, hip flexion, trunk angle, and shoulder rotation.
* A design-level Metric Definition example associates `knee_flexion` with unit `degree`.
* The persisted and API Metric Summary item does not contain `unit`, label, category, schema version, calculation version, or definition version.
* The metrics artifact stores a version, but `MetricSummaryRepository` does not retain or expose that version with summary values.
* Record Metadata does not contain structured activity type, movement type, exercise, side, analysis type, Record type, `capturedAt`, `recordedAt`, `completedAt`, `updatedAt`, fps, or frame count in the implemented schema.
* Tags and free-text title/description exist, but they are not authoritative activity, movement, or side identifiers.
* Existing backend fixtures cover one `knee_flexion` summary and validation failures.
* Existing frontend fixtures cover Record Metadata and Viewer/Compare runtime data, but there is no Dashboard fixture or multi-Record compatible Metric Summary fixture.

# 4. Metric Comparison Feasibility

## 4.1 Confirmed Findings

Current Metric Summary values from different Records are **not proven directly comparable**.

The current contract cannot verify:

* equal units;
* equal metric definition or calculation version;
* equal activity or movement;
* equal body side;
* equal analysis type;
* equal recording conditions;
* semantic compatibility of identically named `metricId` values over time.

Missing metrics are possible because summary is represented as a list and no registry completeness requirement is enforced. A Ready Record must have at least one Metric Summary item, but it need not contain any particular metric key.

## 4.2 Locked Aggregation Rules

Until compatibility metadata is added and validated:

* No Metric Summary metric is approved for cross-Record average, minimum, maximum, total, score, or percentile aggregation.
* No Metric Summary metric is approved as a default historical trend.
* Missing Metric Summary values must be omitted and must never be converted to zero.
* Free-text title, description, or tags must not be used to infer activity, movement, exercise, side, unit, or metric version.
* `rangeOfMotion` is a per-Record derived range; it must not be summed and must not be averaged across unverified Records.
* Per-Record `min` and `max` must not be combined into a global min/max across unverified Records.
* `average` is a per-Record frame aggregate and must not be averaged across Records without compatible definitions and a documented weighting rule.
* Counts by Record status are safe because they use Record Metadata rather than Metric Summary.

## 4.3 Minimum Compatibility Key for Task 56

Before a trend can be implemented, each trend point must be groupable by an authoritative compatibility key:

```text
metricId
unit
metricDefinitionVersion or calculationVersion
activityType or movementType (when metric semantics depend on movement)
side (when the metric is side-specific)
```

Only exact-key matches may share a trend series. Unknown/missing compatibility fields make the item ineligible for a multi-Record trend.

# 5. Confirmed Reusable APIs

| API | Reuse decision |
| --- | --- |
| `GET /api/records` | Reuse for Task 54 Recent Records. It already returns owned, newest-first Record Metadata in one request. |
| `GET /api/records/{recordId}` | Do not use from Dashboard. It exposes runtime URLs and would cause N+1 requests. |
| `GET /api/me` | Reuse indirectly through existing `ProtectedRoute`. |
| `GET /api/dashboard/summary` | Design-only contract; not currently implemented. Candidate for Tasks 55–56 after its response is locked. |

# 6. Confirmed Reusable Frontend Components and Utilities

## 6.1 Directly reusable

* `ProtectedRoute` — authenticated boundary.
* `AuthStatus` — current account/logout control.
* `formatRecordDate` — existing locale date/time formatter.
* `formatRecordDuration` — existing nullable duration formatter.
* `getRecordStatusMeta` — status label and tone mapping for all four known statuses.
* `buildRecordViewerPath` — safely builds `/records/:recordId`.
* `PageShell` and `PageShell.module.css` — shell-level pattern only; the current placeholder shell is too limited for Dashboard sections and should not own Dashboard business logic.
* Records/Compare responsive CSS patterns — useful implementation references for grid collapse, wrapping, and overflow control.

## 6.2 Present but not directly reusable

* `RecordCard` is a private function inside `RecordsPage.tsx`; it is not exported and is coupled to the full Records page layout.
* Status badge markup/styles are duplicated and local to Records and Compare; no shared `StatusBadge` component exists.
* Records loading, empty, and error panels are local markup, not exported components.
* `CompareRecordSelector` is specific to full Compare selection and must not be embedded in Dashboard.
* `MetricPanel` is a Viewer runtime component and is not a Dashboard summary/trend component.

## 6.3 Not currently available

* Shared `RecordCard` or `RecordRow`
* Shared loading skeleton
* Shared empty-state component
* Shared error/retry component
* Shared responsive Dashboard container
* Shared metric formatter based on an authoritative definition registry
* Chart component
* Charting dependency

**Locked:** Task 54 may extract only the smallest reusable Record presentation primitive if needed. It must not refactor unrelated Records/Compare UI or create a broad design system.

# 7. Dashboard Route Behavior and Quick Actions

## 7.1 Route Behavior

**Locked:**

* Route: `/dashboard`.
* Access: authenticated users only through existing `ProtectedRoute`.
* Authenticated landing: `/` and successful login without a valid return intent lead to `/dashboard`.
* Unauthenticated access: redirect to `/login?redirectTo=%2Fdashboard`.
* Logout: redirect to `/login`.
* Dashboard Record links remain subject to backend ownership checks.

## 7.2 Quick Action Routes

| Action | Locked destination | Repository finding |
| --- | --- | --- |
| Start Capture | `/capture` | Existing protected route |
| Upload Record | Not currently available | No standalone upload route or UI entry exists |
| View All Records | `/records` | Existing protected route |
| Open Compare | `/compare` | Existing protected route |

**Gap:** The requirement for an Upload Record Quick Action conflicts with the rule that Quick Actions navigate only to existing routes. `/capture` must not be silently relabeled as Upload Record because the current page is a camera capture flow, not a file-upload entry point.

**Locked resolution:** Tasks 54–57 must not add a route or duplicate upload functionality. Until an existing upload route is provided by an approved non-Dashboard change, the Dashboard may expose the other three navigation actions and must document/omit the unavailable Upload Record action rather than provide a misleading or dead link.

# 8. Dashboard Section Definitions

## 8.1 Recent Records — Task 54

**Locked behavior:**

* Display exactly the first 5 owned Records returned by `GET /api/records`.
* Sort by `createdAt` descending. This is already guaranteed by the current backend repository; the frontend must not invent a different date.
* No Dashboard pagination. `View All Records` navigates to `/records`.
* Display `title`, formatted `createdAt`, status, and lightweight metadata already present in the list response: description, tags, duration, and optionally thumbnail.
* Compact Metric Summary is not shown in Task 54 because Record List does not include it and per-Record detail requests are forbidden.
* `Ready` action label: `Open Viewer`; destination: `/records/:recordId`.
* `Uploading`, `Processing`, `Failed`, and unknown status action label: `View Record`; destination: `/records/:recordId`, where existing Record Detail behavior can show the non-Ready state without runtime loading.
* Unknown status must use a neutral visual treatment and `View Record`; it must not be treated as Ready.
* Do not duplicate full Records filtering, pagination, Compare selection, or management controls.

**Task 54 reuse:** `useGetRecordsQuery`, `RecordListItem`, `formatRecordDate`, `formatRecordDuration`, `getRecordStatusMeta`, and `buildRecordViewerPath`.

## 8.2 Quick Actions

Quick Actions are navigation only. They do not mount Capture, upload, Records, Viewer, or Compare feature logic.

The locked destinations and Upload Record gap are defined in Section 7.2.

## 8.3 Summary Cards — Task 55

**Locked definitions:**

| Card | Definition | Data source |
| --- | --- | --- |
| Total Records | Count of all owned Records, all canonical statuses | Dashboard aggregation or current unpaginated Record List total |
| Ready Records | Count where persisted status is exactly `Ready`; this is the only meaning of “Completed” | Dashboard aggregation or current unpaginated Record List |
| Failed Records | Count where persisted status is exactly `Failed` | Dashboard aggregation or current unpaginated Record List |
| Recent Activity | Count of owned Records with `createdAt` in the trailing 30 days | Prefer Dashboard aggregation; `createdAt` is the only implemented timestamp |

**Locked terminology:**

* The UI should say `Ready Records`, not `Completed Records`, to avoid silently creating a new status meaning.
* “Training count” is not an implemented domain concept. It is not used in MVP Summary Cards.
* Recent Activity uses a fixed trailing 30-day window and `createdAt` until an authoritative `capturedAt`/`recordedAt` is implemented.

**Metric Summary card:**

* No cross-Record Metric Summary card is approved with the current contract.
* A metric card may be added in Task 55 only after compatible unit/version/activity/side metadata exists and a precise statistic is locked.
* Missing values are omitted, never zero-filled.
* Task 55 must not introduce performance scores, AI interpretation, or new business rules.

## 8.4 Metric Summary Trend — Task 56

**Locked behavior once compatible data exists:**

* Source is Metric Summary only.
* One backend response must provide all eligible points; no per-Record requests are allowed.
* Do not fetch `seriesUrl`, Video, Pose, or Viewer/Compare runtime data.
* Use a fixed allowlist of trend metrics supplied by an authoritative definition/contract. Do not accept arbitrary client-inferred keys as comparable.
* There is no approved default metric today because the repository does not prove compatibility.
* A metric chooser may be implemented only from the fixed compatible list returned by the API or defined by the approved metric registry.
* Group/filter by exact compatibility key from Section 4.3.
* Chronological order uses `createdAt` because it is the only implemented Record timestamp.
* Skip Records missing the selected compatible metric.
* Two compatible points are the minimum for a line/trend.
* One compatible point is shown as a latest-value/single-point state with text stating that another compatible Record is needed; do not imply direction.
* Zero compatible points shows the no-compatible-metrics empty state.
* Tooltip fields: Record title, formatted `createdAt`, metric label/key, summary statistic name, value, unit, and status. It must not expose runtime URLs.
* Point navigation: Ready Record → `/records/:recordId`; a defensive non-Ready point → `/records/:recordId` as Record detail. The backend should normally emit trend points only for Ready Records.

**Current feasibility:** Task 56 is not implementation-ready until the API/data compatibility gap in Sections 4 and 13 is resolved.

# 9. Record Metadata Contract for Dashboard

## 9.1 Confirmed current contract

Dashboard-safe current fields are:

```typescript
type DashboardRecordMetadata = {
  recordId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  duration: number | null;
  status: "Uploading" | "Processing" | "Ready" | "Failed";
  tags: string[];
  createdAt: string;
};
```

`userId` is used server-side for ownership and must not be accepted from or trusted to frontend filtering.

## 9.2 Missing recommended metadata

The approved design model mentions fields not implemented in Record schemas/repository: `capturedAt`, fps, frame count, and updated timestamp. They remain unavailable to Sprint 4 until separately added through an approved contract change.

# 10. Metric Summary Contract for Dashboard

## 10.1 Confirmed current contract

```typescript
type CurrentMetricSummaryItem = {
  metricId: string;
  min: number;
  max: number;
  average: number;
  rangeOfMotion: number;
};
```

All numeric fields are required and finite in the upload contract. The summary list is required and non-empty at metrics completion, but a defensive Dashboard contract should still tolerate missing/empty summary data because storage or legacy data may be incomplete.

## 10.2 Required compatibility extension before trends

The smallest acceptable trend item must additionally expose:

```typescript
type CompatibleMetricSummaryItem = CurrentMetricSummaryItem & {
  unit: string;
  metricDefinitionVersion: string;
  activityType: string | null;
  side: string | null;
};
```

If the Metrics Engine uses a different authoritative version field name, that name may replace `metricDefinitionVersion`, but an explicit calculation/definition compatibility identifier is mandatory.

# 11. Loading, Empty, Error, Retry, and Partial Success

## 11.1 Loading

**Locked:**

* Dashboard shell/title and Quick Actions render immediately after the existing auth check.
* Recent Records has its own skeleton/loading region.
* Summary Cards have stable-size skeleton cards.
* Trend has a stable-height chart skeleton.
* Sections may load independently when backed by independent requests.
* Loading must not render a blank page or cause major layout shift.

Task 54 may initially have only the Record List request. Task 55/56 must preserve section independence when Dashboard aggregation is introduced.

## 11.2 Empty states

| Condition | Locked behavior |
| --- | --- |
| No Records | Show first-record guidance and Start Capture; Recent Records is empty; counts are zero; trend is not rendered |
| Records exist, none Ready | Show recent metadata and statuses; explain that Ready Records are required for metrics/trends |
| Ready Records exist, no Metric Summary available | Recent Records and counts remain visible; show a Metric Summary unavailable empty state |
| One compatible trend point | Show the point/latest value and state that at least two compatible Records are needed |
| No compatible trend points | Explain that no compatible Metric Summary history is available; do not render a zero line |

## 11.3 Error and Retry

**Locked:**

* Record API failure: Recent Records and Record-derived cards show section errors with retry. Quick Actions remain available.
* Summary API failure: Summary Cards show a section error/retry; Recent Records remains visible if its request succeeded.
* Trend API failure: Trend shows a section error/retry; Recent Records and cards remain visible.
* Partial section failure is not promoted to a full-page failure.
* Section retry refetches only the failed query/section.
* Full-page retry is shown only when every data section has failed; it refetches all failed Dashboard queries.
* Error copy must not expose storage paths, signed URLs, tokens, or stack traces.

# 12. Ownership and Authorization Rules

**Locked:**

* Dashboard displays only Records owned by the authenticated user.
* All Dashboard/Record aggregation queries must take the user identity from the backend session dependency.
* Frontend filtering is presentation only and is never an authorization control.
* Metric Summary inherits ownership through its parent Record. A summary is returned only after the backend has selected an owned Record.
* Record links do not bypass `GET /api/records/{recordId}` ownership checks.
* Cross-user counts, recent records, and trends are forbidden.
* Unauthenticated users cannot access `/dashboard` or Dashboard APIs.
* For another user's or nonexistent Record, preserve the existing non-disclosing `404 RECORD_NOT_FOUND` behavior.

# 13. Required API Changes and Gaps

## 13.1 No API change required for Task 54

Task 54 can use one `GET /api/records` request and take the first five newest items. It must not call Record Detail for each row.

This is acceptable for the current MVP/in-memory implementation. The absence of server-side `limit` remains a scalability gap, not a blocker for Task 54.

## 13.2 Minimal Dashboard aggregation contract for Tasks 55–56

The documented but unimplemented endpoint is the correct resource boundary:

```http
GET /api/dashboard/summary
```

The current design example (`totalRecords`, `recentRecords`, `metricTrends`) is underspecified. Before implementation, its response should minimally distinguish independent sections and compatibility metadata:

```typescript
type DashboardSummaryResponse = {
  counts: {
    totalRecords: number;
    readyRecords: number;
    failedRecords: number;
    recentActivityCount: number;
    recentActivityWindowDays: 30;
  };
  metricTrends: Array<{
    metricId: string;
    unit: string;
    metricDefinitionVersion: string;
    activityType: string | null;
    side: string | null;
    statistic: "average" | "min" | "max" | "rangeOfMotion";
    points: Array<{
      recordId: string;
      recordTitle: string;
      createdAt: string;
      value: number;
    }>;
  }>;
};
```

**Locked API rules:**

* Backend applies ownership before aggregation.
* Backend does not return Video/Pose/Metric Series URLs.
* Backend emits only finite values and exact compatible groups.
* Summary/trend query is bounded and avoids N+1 repository/service access patterns.
* Recent Records may remain on `GET /api/records` to preserve partial-success isolation, or later be included in the Dashboard response if the client still has independently recoverable section state. Task 54 does not wait for this endpoint.

## 13.3 Persistence gaps

Before Task 56, the backend must persist or authoritatively derive unit and metric definition/calculation version alongside Metric Summary. Activity and side must be explicitly represented when required for the metric; tags are not a safe substitute.

No backend implementation is authorized by Task 53.

# 14. Required Frontend Types

Task 54 requires no new domain fields. It may define presentation props around existing `RecordListItem`.

Later tasks will require:

* `DashboardCounts`
* `DashboardSummaryResponse`
* `DashboardMetricTrend`
* `DashboardMetricTrendPoint`
* `DashboardSectionState` or equivalent local/query-state composition

Types must live in the existing frontend type/service architecture and must not import Viewer/Compare runtime types.

# 15. Component Boundaries

**Locked proposed boundaries:**

```text
DashboardPage
├── DashboardHeader
├── QuickActions
├── SummaryCards                 (Task 55)
├── RecentRecordsSection         (Task 54)
│   └── RecentRecordItem
└── MetricSummaryTrendSection    (Task 56)
```

State/error primitives may remain section-local in Task 54 and be extracted only when Task 57 demonstrates actual reuse.

**Boundary rules:**

* `DashboardPage` composes sections and queries; it does not calculate Metrics Engine values.
* `RecentRecordsSection` receives Record Metadata only.
* `SummaryCards` receives precomputed counts; it does not fetch Record Detail.
* `MetricSummaryTrendSection` receives compatible summary points only; it never loads Metric Series.
* Quick Actions contain links only.
* Dashboard components do not embed `RecordViewerPage`, `CompareRecordSelector`, Capture pipeline hooks, upload pipeline hooks, or Viewer/Compare loaders.

# 16. Responsive Expectations

## 16.1 Desktop

* Full Dashboard content within a centered max-width container.
* Summary Cards use a multi-column grid.
* Recent Records may use a compact multi-column row.
* Trend uses available container width and readable axis/tooltip labels.

## 16.2 Tablet

* Summary Cards wrap to two columns where space permits.
* Quick Actions wrap without clipping.
* Recent Record metadata may move below the title/status area.
* Trend remains full container width.

## 16.3 Mobile

* Single-column section flow.
* Summary Cards and Quick Actions become one or two columns based on minimum touch-target width.
* Recent Record items stack; actions remain visible without horizontal scrolling.
* Trend uses a horizontally constrained responsive chart, reduced tick density, and accessible tooltip/point details. The page itself must not horizontally scroll.

## 16.4 Content resilience

* Long Record names wrap or truncate with an accessible full value; they must not push status/actions off-screen.
* Long/unknown status labels wrap or use a bounded badge and neutral tone.
* Large numeric values use safe wrapping/compact formatting only when semantics remain exact.
* Dates use `formatRecordDate`; do not rely on fixed-width English date strings.
* Grid children use `min-width: 0`; chart/container width must be derived from its parent.
* Desktop, tablet, and mobile layouts must prevent horizontal overflow at common zoom levels.

# 17. Testing Strategy

## 17.1 Confirmed frameworks and conventions

* Frontend: Vitest through `npm test`; tests colocate as `*.test.ts`/`*.test.tsx`.
* Current frontend tests primarily validate pure functions, API endpoint registration, route structure, and React element behavior. No browser E2E framework or DOM testing library is installed.
* Backend: pytest-style functions using FastAPI `TestClient`; the environment currently receives pytest through FastAPI test dependencies rather than listing it explicitly in `requirements.txt`.
* Authentication helpers are local `_login` functions that call `/api/auth/mock-login`.
* Ownership integration tests use separate authenticated `TestClient` instances for different providers/users.
* Backend fixtures are built through helper functions and shared in-memory runtime repositories; there is no central fixture factory or `conftest.py`.
* Sprint 3 Compare tests provide reusable conventions for Ready-only selection, route parameter validation, missing runtime data, null/malformed metric values, and responsive/runtime issue logic.

## 17.2 Required coverage by task

**Task 54:**

* newest-first first-five selection;
* Ready vs non-Ready navigation labels/destinations;
* all known statuses plus defensive unknown presentation;
* empty Record list;
* no Record Detail/N+1 query usage;
* protected route remains intact.

**Task 55:**

* exact status counts;
* `Ready` is the completed definition;
* trailing 30-day `createdAt` boundary;
* missing values are not treated as zero;
* backend ownership for aggregation if Dashboard API is introduced.

**Task 56:**

* exact compatibility grouping by metric/unit/version/activity/side;
* skip missing metrics;
* zero, one, and two-or-more point behavior;
* chronological ordering by `createdAt`;
* no runtime URLs in response;
* one request and no N+1 behavior;
* owned Records only.

**Task 57:**

* independent section loading/error states;
* section retry;
* partial success;
* full-page retry only when all data sections fail;
* responsive content/overflow QA.

# 18. Acceptance Criteria

Task 53 is accepted when:

* [x] Current auth, routing, Record, Metric Summary, component, and test implementation is documented.
* [x] Confirmed facts are separated from locked decisions, gaps, and deferred work.
* [x] Dashboard is restricted to Record Metadata and Metric Summary.
* [x] Video, Pose, Metric Series, Viewer runtime, and Compare runtime are explicitly excluded.
* [x] Recent Records count, sort, fields, status behavior, destinations, and reuse boundary are locked.
* [x] Quick Action routes and the missing Upload Record route are documented without inventing a route.
* [x] Summary Card definitions and time window are locked.
* [x] Metric comparability is not assumed and unsafe aggregation is prohibited.
* [x] Trend compatibility, point count, ordering, tooltip, and navigation rules are defined.
* [x] Loading, empty, error, retry, and partial-success behavior is defined.
* [x] Ownership and authorization rules are preserved.
* [x] Responsive expectations and component boundaries are defined.
* [x] Minimal API gaps are identified without implementation.
* [x] Testing strategy and Task 54 implementation boundary are defined.
* [x] Sprint task numbers/names and scope remain unchanged.

# 19. Explicit Non-Goals

Sprint 4 Dashboard excludes:

* Video playback inside Dashboard
* Skeleton rendering
* Pose data loading
* Metric Series loading
* Per-frame charts
* New Metrics Engine calculations
* AI recommendations
* Automated performance scoring
* Predictions
* Team Dashboard
* Admin Dashboard
* Cross-user comparison
* Notifications
* Real-time updates
* WebSockets
* Customizable widgets
* Drag-and-drop layout
* Reporting export
* Full Record List duplication
* Full Compare selector duplication
* New Capture, Upload, Viewer, Compare, or Record management functionality

# 20. Risks and Open Questions

| Item | Type | Impact / resolution |
| --- | --- | --- |
| Metric Summary lacks unit/version/activity/side | Blocking gap for Task 56 | Add authoritative compatibility metadata before trend implementation |
| No standalone Upload Record route | Open product/navigation question | Dashboard must not invent a route; not a Task 54 blocker |
| Dashboard API is documented but not implemented/fully specified | Gap for Tasks 55–56 | Lock and implement minimal aggregation contract in the relevant later task |
| Record List has no server limit/pagination despite design spec | Scalability risk | Task 54 may take first five from the current one-request response; revisit only within approved API work |
| `duration` always returns null | Data completeness risk | Display Pending/Unavailable; do not derive it from video |
| `Processing` has no current write transition | Implementation mismatch | Display it if returned; do not redefine lifecycle in Dashboard |
| Backend repositories are in-memory, not PostgreSQL | Persistence/environment risk | Dashboard must use repository/service boundaries so persistence can change without UI contract changes |
| No chart library or chart component | Task 56 implementation choice | Select only when Task 56 is ready; do not add dependency in Task 53 |
| Existing RecordCard/status/state UI is not shared | Small duplication/reuse risk | Extract minimally only when Task 54 proves reuse; avoid broad refactor |
| `createdAt` is not the same as capture time | Semantic limitation | Use and label Created date until authoritative captured/recorded timestamp exists |

# 21. Recommended Implementation Boundary for Task 54

Task 54 may:

* Replace the Dashboard placeholder with a Dashboard page/header and Recent Records section.
* Call `useGetRecordsQuery()` once.
* Select the first five records from the already newest-first response.
* Add Task 54-specific presentation components and CSS under Dashboard/records feature boundaries.
* Reuse existing Record types and display utilities.
* Add focused Vitest coverage for selection, status behavior, links, and empty/loading/error presentation needed by Recent Records.
* Add Start Capture, View All Records, and Open Compare navigation only if included as minimal Dashboard scaffolding; Upload Record must remain unavailable until a real existing route is confirmed.

Task 54 must not:

* Implement Summary Cards, metric aggregation, trend/chart UI, or the Dashboard API.
* Fetch Record Detail per Record.
* Load Video, Pose, Metric Series, or runtime hooks.
* Add Record filtering, pagination, management, Compare selection, Capture, or upload logic.
* Add a chart dependency.
* Change Record statuses, ownership, auth flow, task numbering, or Sprint scope.

**Readiness:** Task 54 is ready to begin within this boundary. Tasks 55 and 56 require separate contract decisions; Task 56 is blocked on compatibility metadata.

# 22. Decisions Deferred to Later Sprint 4 Tasks

## Task 55 — Summary Cards

* Implement count cards and their query/API placement.
* Decide whether counts remain derived from the current unpaginated response or move immediately to Dashboard aggregation.
* Do not add a Metric Summary aggregate card unless compatibility metadata and an exact statistic are approved.

## Task 56 — Metric Summary Trend

* Resolve and implement Metric Summary compatibility persistence/API fields.
* Lock the supported metric allowlist and statistic per metric.
* Select or build the smallest accessible chart solution.
* Implement trend API/service/repository behavior without runtime artifact access or N+1 requests.

## Task 57 — Dashboard Empty / Loading / Error States

* Complete independent section state orchestration, retry behavior, partial-success integration, and responsive QA.
* Extract shared state components only when demonstrated by repeated use.

# 23. Inspection Record

## 23.1 Files inspected

### Governing and scope documents

* `docs/00_MASTER_CONTEXT.md`
* `docs/02_PRODUCT_SPEC.md`
* `docs/04_ANALYSIS_PIPELINE_SPEC.md`
* `docs/05_TECH_STACK_SPEC.md`
* `docs/06_DATA_MODEL_SPEC.md`
* `docs/07_STORAGE_SPEC.md`
* `docs/10_METRICS_ENGINE_SPEC.md`
* `docs/12_API_SPEC.md`
* `docs/13_FRONTEND_ARCHITECTURE.md`
* `docs/14_BACKEND_ARCHITECTURE.md`
* `docs/15_UI_UX_SPEC.md`
* `docs/16_UI_COMPONENT_SPEC.md`
* `docs/17_CODING_GUIDELINES.md`
* `docs/18_DECISION_LOG.md`
* `docs/19_BACKLOG.md`
* `docs/20_AGENTS.md`
* `docs/SPRINT_ROADMAP_CLARIFICATION.md`

### Frontend implementation and tests

* Application router, route table, route tests, app/provider setup
* ProtectedRoute, AuthStatus, LoginPage, PageShell, DashboardPage
* CapturePage, RecordsPage, RecordViewerPage, ComparePage
* Record, upload, auth, compare, and runtime TypeScript types
* Records, uploads, auth, compare, and base RTK Query services/tests
* Record display utilities/tests
* Compare selection, route, runtime, metric-difference components/utilities/tests
* Viewer/Compare metric and artifact loaders/fixtures
* Shared component exports and relevant CSS Modules
* `frontend/package.json` and `frontend/vite.config.ts`

### Backend implementation and tests

* API router, auth dependencies, Records and Upload routes
* Record and Upload schemas
* Record, Upload, and auth services
* Record, Metric Summary, artifact, and runtime repositories
* Record, Upload, auth, and annotation API tests
* `backend/requirements.txt`

## 23.2 Files created

* `docs/SPRINT_4_TASK_53_DASHBOARD_SCOPE_LOCK.md`

## 23.3 Files modified

* None.

# 24. Task 53 Final Lock Summary

1. **Confirmed Record data source:** owned, newest-first `GET /api/records`; Record Detail is forbidden for Dashboard list aggregation.
2. **Confirmed Metric Summary source:** `MetricSummaryRepository`, currently exposed only through Ready Record Detail; no safe Dashboard endpoint is implemented.
3. **Confirmed reusable frontend assets:** protected auth boundary, auth status/logout, Record types/query, date/duration/status/path utilities, and responsive layout patterns. Record cards/state panels are not shared components.
4. **Confirmed routes:** `/dashboard`, `/capture`, `/records`, `/records/:recordId`, `/compare`; no Upload Record route exists.
5. **Metric comparison finding:** no current metric is proven safe for cross-Record aggregation/trending because unit/version/activity/side compatibility is absent.
6. **Required API gaps:** Dashboard aggregation endpoint implementation and Metric Summary compatibility metadata for Tasks 55–56; no API change is required for Task 54.
7. **Task 54 locked decisions:** five owned Records, `createdAt` descending, no pagination, no metrics/N+1, Ready → Open Viewer, all other/unknown statuses → View Record, View All → `/records`.
8. **Deferred:** count implementation/query placement to Task 55; metric compatibility, allowlist, statistic, API, and chart choice to Task 56; complete independent state/retry/partial-success orchestration to Task 57.
9. **Primary unresolved risks:** missing Upload Record route, summary compatibility metadata, server-side limit, and authoritative capture/activity fields.
10. **Task 54 readiness:** Ready to begin. Do not continue automatically.
