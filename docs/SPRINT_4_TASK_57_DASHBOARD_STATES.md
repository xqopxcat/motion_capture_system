# Sprint 4 — Task 57: Dashboard Empty / Loading / Error States

## Scope

Task 57 completes Dashboard state integration and hardening without adding a new task, endpoint, metric, analysis rule, or runtime-data dependency. It preserves the Task 53–56 behavior and closes Sprint 4 for final review.

## State architecture and query ownership

`DashboardPage` remains the single controller and owns exactly two RTK Query subscriptions:

- `useGetRecordsQuery`: shared by Summary Cards and Recent Records.
- `useGetDashboardSummaryQuery`: used by Metric Summary Trend.

Presentation components receive normalized data, query state, and retry callbacks through props. Server data is not copied into Redux, no direct `fetch` is used, and no effect-based orchestration was added.

Normal Dashboard rendering issues one Record List request and one Dashboard Summary request. It issues no Record Detail, Video, Pose, Metric Series, Viewer-runtime, or Compare-runtime request. The Dashboard service continues to load Metric Summaries through one repository aggregation call rather than per Record.

## Additive diagnostic contract clarification

Task 57 adds the following optional-to-older-consumers response field to the existing `GET /api/dashboard/summary` response:

```json
{
  "trendAvailability": {
    "readyRecords": 3,
    "recordsWithMetricSummary": 2,
    "recordsWithCompatibleMetricSummary": 0
  }
}
```

This is the minimum additive contract change needed for the locked empty-state distinction. Existing `counts` and `metricTrends` names and semantics are unchanged. Counts are restricted to the authenticated user's Records, count each Record at most once, and use only status exactly equal to `Ready`. Compatibility requires persisted unit, definition version, activity, and side metadata. Missing metadata is not inferred and missing values are not converted to zero. Metric Series is never loaded or parsed.

## Loading behavior

The page heading and Quick Actions render immediately. Summary Cards, Recent Records, and Metric Trend retain independent, stable-size loading placeholders. Loading does not render temporary zeroes or premature empty states.

## Empty-state matrix

| Condition | Trend presentation |
| --- | --- |
| `readyRecords === 0` | No Ready Records |
| Ready Records exist and `recordsWithMetricSummary === 0` | No Metric Summary |
| Metric Summaries exist and `recordsWithCompatibleMetricSummary === 0` | No Compatible Metric Summary |
| Compatible records exist but selected series has 0 points | No compatible history for this metric |
| Selected series has 1 point | Single-point / insufficient trend state |
| Selected series has 2+ points | Existing trend chart |

An empty Record List is a successful state: Summary Cards show zeroes and Recent Records offers Start Capture.

## Error, partial-success, and retry matrix

| Records query | Trend query | Result |
| --- | --- | --- |
| Success | Failure | Summary and Recent Records remain usable; Trend shows its retry |
| Failure | Success | Trend remains usable from its owned, Dashboard-safe response; Record sections show errors |
| Failure | Failure | One Dashboard-level failure summary and one shared retry; section context remains visible |

Section retry refetches only its failed query. Because Summary Cards and Recent Records share the Record query, only Recent Records presents the Record retry. Full Dashboard retry appears only when both meaningful data queries failed and calls only failed refetch callbacks. Buttons are disabled and labelled as retrying while a request is in flight. Retry never reloads the browser or clears unrelated successful cache.

## Defensive data handling

Pure normalization utilities:

- preserve valid Records with unknown status and display that status neutrally;
- replace missing/blank Record titles with `Untitled Record`;
- retain null duration, empty tags, and missing thumbnails safely;
- exclude invalid dates from Recent Activity through the existing summary utility;
- reject incomplete trend series compatibility metadata;
- omit invalid dates, non-Ready points, and non-finite values;
- preserve valid zero metric values rather than treating them as missing;
- never mutate API arrays while filtering or chart sorting;
- reject internally inconsistent availability counts as a contract error.

## Responsive and accessibility hardening

Existing desktop, two-column tablet, and single-column mobile layouts are preserved. New failure and trend-value content wraps safely, selector labels remain width-constrained, and retry controls stay within the viewport. Loading animations continue to respect reduced-motion preferences.

Errors use section headings and alert semantics. Retry controls are native keyboard-accessible buttons with visible focus behavior. The SVG retains its title/description, and an expandable text list now exposes every trend Record, date, value, and unit so chart points are not the only source of essential information.

## Tests

Backend coverage verifies:

- no Ready Records;
- Ready Record without Metric Summary;
- incomplete compatibility metadata;
- compatible persisted data;
- multiple metrics on one Record do not duplicate counts;
- authenticated ownership isolation;
- existing response fields remain present;
- runtime artifact URLs are absent.

Frontend coverage verifies the locked empty-state matrix, loading and failure independence, partial success in both directions, one full-failure retry control, retry-in-progress state, failed-query-only refetch, single/multi-point behavior, and defensive normalization.

## Files created

- `frontend/src/features/dashboard/dashboardState.ts`
- `frontend/src/features/dashboard/dashboardState.test.ts`
- `docs/SPRINT_4_TASK_57_DASHBOARD_STATES.md`

## Files modified

- `backend/app/schemas/dashboard.py`
- `backend/app/services/dashboard_service.py`
- `backend/app/tests/test_dashboard.py`
- `frontend/src/features/dashboard/index.ts`
- `frontend/src/features/dashboard/dashboardRecentRecords.ts`
- `frontend/src/features/dashboard/dashboardRecordSummary.ts`
- `frontend/src/pages/DashboardPage/DashboardPage.tsx`
- `frontend/src/pages/DashboardPage/DashboardPage.module.css`
- `frontend/src/pages/DashboardPage/DashboardPage.test.tsx`
- `frontend/src/services/dashboardApi.test.ts`
- `frontend/src/types/dashboard.ts`
- `frontend/src/types/index.ts`
- `docs/12_API_SPEC.md`

## Known limitations and readiness

The Dashboard intentionally does not synthesize compatibility metadata for legacy summaries. Such data remains visible only after it is persisted with the complete Task 53/56 metadata contract. No browser E2E framework was introduced; UI integration uses the repository's existing static React and pure-function test conventions, while ownership and safe-response boundaries are covered by backend API tests.

There are no known Task 57 blockers. Sprint 4 is ready for final review; no subsequent Sprint is started by this work.
