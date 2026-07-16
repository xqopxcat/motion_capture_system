# Sprint 4 Task 56 — Metric Summary Trend UI

---

| Item | Value |
| --- | --- |
| Document | SPRINT_4_TASK_56_METRIC_SUMMARY_TREND_UI.md |
| Sprint | Sprint 4 — Dashboard |
| Task | Task 56 — Metric Summary Trend |
| Increment | Trend Presentation |
| Status | Implemented |
| Last Updated | 2026-07-17 |

---

# 1. Purpose and Boundary

This increment connects the Task 56 Dashboard Summary API foundation to a compatibility-safe Metric Summary Trend section.

Implemented:

* one Dashboard Summary query;
* exact-compatible series selector;
* zero-, one-, and multi-point presentation;
* responsive inline SVG trend chart;
* point-to-Viewer navigation;
* Trend loading, error, and retry states;
* chart accessibility and focused tests.

Not implemented:

* Metric Series or per-frame charting;
* Record Detail requests;
* Video, Pose, Viewer runtime, or Compare runtime loading;
* performance scores, trend judgment, arrows, or predictions;
* chart dependency;
* Task 57 full Dashboard state orchestration.

# 2. Query Ownership

Dashboard now uses two fixed page-level queries:

```text
useGetRecordsQuery()
├── Summary Cards
└── Recent Records

useGetDashboardSummaryQuery()
└── Metric Summary Trend
```

The Trend presentation receives `metricTrends` through props and calls no API itself.

Request guarantees:

* one Record List request;
* one Dashboard Summary request;
* no Record Detail requests;
* no per-Record requests;
* no N+1 requests;
* no runtime artifact requests.

# 3. Series Selection

The backend already returns exact-compatible series grouped by:

```text
metricId
unit
metricDefinitionVersion
activityType
side
```

UI behavior:

* no series: render the compatible-history empty state;
* one series: render it directly without a redundant selector;
* multiple series: render a native select containing every returned compatibility group;
* initial selection: first series in the deterministic API order;
* a still-valid user selection is preserved across rerenders;
* if the selected series disappears, fall back to the first available series.

The selector label displays metric ID, activity, side, and unit. It does not infer a friendly metric name or choose a “best” series.

# 4. Point-count Behavior

## Zero Points

Display `No compatible metric history`. No zero line or fabricated value is shown.

## One Point

Display:

* exact value and unit;
* Record title;
* formatted creation date;
* Ready status;
* Open Viewer link;
* text explaining that another compatible Record is required to establish a trend.

No direction, improvement, decline, percentage, or score is implied.

## Two or More Points

Display a chronological line chart using stored per-Record `average` values.

The frontend defensively:

* removes non-finite values and invalid dates;
* sorts a copied point array by `createdAt` ascending;
* does not mutate the API response;
* pads a flat-value domain so coordinates remain finite;
* uses first and last dates as compact x-axis labels;
* uses maximum, midpoint, and minimum y-axis labels.

# 5. Chart and Tooltip Contract

The chart is dependency-free inline SVG with a responsive `viewBox`.

Every point is a keyboard-accessible SVG link to:

```text
/records/:recordId
```

Its accessible label and native SVG tooltip include:

* Record title;
* formatted `createdAt`;
* metric ID;
* statistic (`average`);
* value and unit;
* activity type;
* side;
* Ready status;
* Viewer destination intent.

The SVG includes `<title>` and `<desc>` content describing the metric, unit, point count, date range, and Ready-only scope. Color is paired with visible labels and point marks.

# 6. Loading, Empty, Error, and Retry

## Loading

* Stable label and chart skeletons are rendered.
* Quick Actions, Summary Cards, and Recent Records use their own query state and remain available.
* Reduced-motion preference disables animation.

## Empty

* No API series produces the no-compatible-history message.
* No Metric Series, score, or future placeholder is rendered.

## Error

* Error remains inside the Trend section.
* Other Dashboard sections remain available.
* `Retry trend` refetches only the Dashboard Summary query.
* Internal response details are not shown.

This section independence is required for Task 56. Task 57 still owns complete Dashboard-wide state/retry/partial-success review.

# 7. Responsive Behavior

## Desktop

* Series selector shares the section header when multiple series exist.
* Chart fills the available centered Dashboard width.

## Tablet

* Header and selector stack.
* Selector uses the full section width.
* SVG retains its aspect ratio.

## Mobile

* Chart panel padding and axis text are reduced.
* Metadata pills wrap.
* Single-point content and Viewer action stack.
* No fixed chart width or horizontal scrolling is introduced.

# 8. Accessibility

* Native labeled `<select>` for compatibility-series selection.
* Semantic section heading and explanatory text.
* SVG has `role="img"`, title, and description.
* Numeric values and units are visible text.
* Point links have detailed accessible names and visible keyboard focus through point fill.
* Loading uses `aria-busy`, polite text, and no fabricated chart values.
* Error uses an alert and a native button.
* Empty and single-point states do not rely on color.

# 9. Files Created and Modified

## Created

* `frontend/src/features/dashboard/dashboardMetricTrend.ts`
* `frontend/src/features/dashboard/dashboardMetricTrend.test.ts`
* `docs/SPRINT_4_TASK_56_METRIC_SUMMARY_TREND_UI.md`

## Modified

* `frontend/src/features/dashboard/index.ts`
* `frontend/src/pages/DashboardPage/DashboardPage.tsx`
* `frontend/src/pages/DashboardPage/DashboardPage.module.css`
* `frontend/src/pages/DashboardPage/DashboardPage.test.tsx`
* `frontend/src/types/dashboard.ts`
* `frontend/src/services/dashboardApi.test.ts`
* `backend/app/schemas/dashboard.py`
* `backend/app/services/dashboard_service.py`
* `backend/app/tests/test_dashboard.py`
* `docs/12_API_SPEC.md`

The backend point contract added the explicit locked `status: "Ready"` field needed by tooltip/accessibility behavior. No runtime data or URL field was added.

# 10. Tests

Pure utility tests cover:

* stable compatibility key;
* readable series label;
* first-series default;
* valid selection preservation;
* missing selection fallback;
* empty series behavior;
* chronological sorting without mutation;
* two-point minimum;
* flat-series finite coordinates;
* invalid date/value removal;
* neutral numeric formatting.

Component/static-render tests cover:

* independent loading state;
* section-level error and retry presentation;
* no-compatible-series empty state;
* single-point state without direction implication;
* multi-point labeled SVG;
* Viewer point links;
* tooltip/accessibility content;
* multiple-series selector options;
* continued visibility of other Dashboard sections.

# 11. Validation

Commands:

```text
npm test -- --run src/features/dashboard/dashboardMetricTrend.test.ts src/pages/DashboardPage/DashboardPage.test.tsx src/services/dashboardApi.test.ts
npm test
npm run build
backend/.venv/Scripts/python.exe -m pytest
```

Focused Trend result:

```text
Test Files  3 passed (3)
Tests       21 passed (21)
```

Full validation result:

```text
Frontend: 32 test files passed, 166 tests passed
Backend:  67 tests passed
Build:    tsc -b and vite build passed
```

Backend pytest emitted the existing cache-write permission warning. Vite emitted the existing bundle-size advisory. Neither affected validation, and no dependency was added. There is no separate frontend lint script.

# 12. Known Limitations

* Metric labels use authoritative `metricId`; no metric definition label registry is exposed by the API.
* Tooltip uses the browser's native SVG title behavior rather than a custom floating surface.
* The API has no time-range or point-count limit.
* Only `average` is supported.
* Legacy summaries without complete compatibility metadata remain intentionally absent.
* Task 57 must complete final cross-section state orchestration and responsive QA.

# 13. Task 57 Readiness

Task 56 is functionally complete after validation. Task 57 — Dashboard Empty / Loading / Error States is the next locked Sprint 4 task.

Do not continue automatically.
