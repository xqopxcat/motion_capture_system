# Sprint 4 Task 55 — Summary Cards

---

| Item | Value |
| --- | --- |
| Document | SPRINT_4_TASK_55_SUMMARY_CARDS.md |
| Sprint | Sprint 4 — Dashboard |
| Task | Task 55 — Summary Cards |
| Status | Implemented |
| Last Updated | 2026-07-17 |

---

# 1. Purpose

Task 55 adds four Dashboard Summary Cards derived only from the authenticated user's complete Record Metadata list already loaded for Task 54.

Implemented cards:

1. Total Records
2. Ready Records
3. Failed Records
4. Recent Activity

No Metric Summary aggregation, Trend, chart, Dashboard backend API, Record API change, or Task 57 orchestration was implemented.

# 2. Summary Definitions

## Total Records

`totalRecords` is `items.length` from the successful `GET /api/records` response.

The current endpoint returns the complete owned Record list without pagination, so `items.length` and response `total` describe the same dataset. The calculation uses the actual input collection to keep all four values deterministic and internally consistent.

Total Records includes:

* Uploading
* Processing
* Ready
* Failed
* unknown future statuses returned at runtime

## Ready Records

Count only Records whose status is exactly `Ready`.

Uploading, Processing, unknown statuses, casing variants, and any future status are not Ready. The UI label is `Ready Records`, not Completed Records.

## Failed Records

Count only Records whose status is exactly `Failed`.

Uploading, Processing, unknown statuses, casing variants, and any future status are not Failed.

## Recent Activity

Count Records whose valid `createdAt` lies within the rolling trailing 30-day window.

The exact closed interval is:

```text
referenceTime - 30 days <= createdAt <= referenceTime
```

Therefore:

* a Record exactly on the 30-day boundary is included;
* a Record one millisecond older is excluded;
* a future-dated Record is excluded;
* invalid or missing runtime date values are ignored;
* a day is exactly 24 hours for this elapsed-time calculation;
* the window is rolling and not a calendar month.

The production page injects `Date.now()` as the reference time. Tests inject a fixed timestamp.

# 3. Summary Calculation

`deriveDashboardRecordSummary(records, referenceTime)` is a pure, deterministic feature utility.

It:

* accepts a readonly Record Metadata collection;
* iterates without sorting or mutation;
* counts exact Ready and Failed statuses;
* includes every item in Total Records;
* validates `createdAt` before counting Recent Activity;
* returns the locked `recentActivityWindowDays: 30` value;
* performs no Metric Summary or performance calculation.

# 4. Shared Record Query Behavior

## Before Task 55

`DashboardPage` owned one call to `useGetRecordsQuery()` and supplied its selected first five items to Recent Records.

## After Task 55

Query ownership is unchanged:

```text
DashboardPage
└── useGetRecordsQuery() exactly once
    ├── complete items → deriveDashboardRecordSummary → SummaryCards
    └── complete items → selectRecentRecords(first 5) → RecentRecordsSection
```

Summary presentation components receive derived values through props and call no API.

Request count remains one Record List request through the existing RTK Query cache. No second Record List hook, Record Detail request, per-Record request, or N+1 pattern was introduced.

# 5. Component Boundaries

```text
DashboardPage
└── DashboardContent
    ├── QuickActions
    ├── SummaryCards
    │   ├── SummaryCard × 4
    │   └── SummaryCardsLoading
    └── RecentRecordsSection
```

Implemented Task 55 components:

* `SummaryCards`
* `SummaryCard`
* `SummaryCardsLoading`

The components remain local to Dashboard and do not create a broad generic design system.

# 6. Loading, Empty, and Error Behavior

## Loading

* Four stable-size Summary Card skeletons are rendered.
* Numeric zero values are not rendered before the query resolves.
* Loading text is available to assistive technology.
* Quick Actions and Task 54 Recent Records loading UI remain visible.
* Reduced-motion preference disables skeleton animation.

## Loaded Empty

When the successful Record response contains no items:

* all four Summary Cards display `0`;
* the state is treated as valid loaded data;
* Task 54 no-Records guidance remains visible;
* no Metric Summary or Trend placeholder is rendered.

## Error and Retry

When the shared Record query fails:

* Summary Cards show a compact unavailable message instead of fabricated zeros;
* Recent Records shows the existing Task 54 error and Retry button;
* that single Retry invokes the shared RTK Query `refetch` function;
* no second retry query/control is added;
* Quick Actions remain available;
* internal error details are not rendered.

# 7. Responsive Behavior

## Desktop

Four cards render in a four-column grid.

## Tablet

Cards wrap into a two-column grid.

## Mobile

Cards stack into one column to preserve readable minimum width.

All breakpoints use `minmax(0, 1fr)` and `min-width: 0`. Labels, contexts, and large numeric values wrap safely without page-level horizontal overflow.

# 8. Accessibility

* The Summary section has an associated heading.
* Each Summary Card is a semantic `article` with a heading, visible numeric text, and optional context.
* Ready and Failed meanings are stated in text; color is not used as the only distinction.
* Recent Activity includes visible `Last 30 days` context.
* Loading uses `aria-busy`, polite loading text, and no misleading numeric values.
* Error copy is textual and does not depend on color.
* Existing link and button focus behavior remains unchanged.

# 9. Files Created and Modified

## Created

* `frontend/src/features/dashboard/dashboardRecordSummary.ts`
* `frontend/src/features/dashboard/dashboardRecordSummary.test.ts`
* `docs/SPRINT_4_TASK_55_SUMMARY_CARDS.md`

## Modified

* `frontend/src/features/dashboard/index.ts`
* `frontend/src/pages/DashboardPage/DashboardPage.tsx`
* `frontend/src/pages/DashboardPage/DashboardPage.module.css`
* `frontend/src/pages/DashboardPage/DashboardPage.test.tsx`

No backend, service, Record API/type contract, authentication, ownership, route, dependency, or unrelated feature file was modified.

# 10. Test Coverage

Pure calculation coverage includes:

* empty list returns four zero values;
* Total Records includes all canonical statuses;
* Total Records includes an unknown future status;
* Ready counts only exact `Ready`;
* Failed counts only exact `Failed`;
* Uploading and Processing are excluded from Ready/Failed;
* trailing 30-day activity;
* exact inclusive 30-day boundary;
* older-than-boundary exclusion;
* future-date exclusion;
* invalid-date exclusion;
* input immutability;
* fixed reference time.

Component-level static-render coverage includes:

* four labels and derived values;
* visible `Last 30 days` context;
* loading skeletons without premature zeros;
* loaded-empty four-zero state;
* error unavailable state without fabricated summary values;
* shared Quick Actions remain visible;
* Task 54 Recent Records behavior and destinations remain intact;
* Retry callback wiring;
* absence of Metric Summary and runtime control content.

# 11. Validation

Commands:

```text
npm test -- --run src/features/dashboard/dashboardRecordSummary.test.ts src/features/dashboard/dashboardRecentRecords.test.ts src/pages/DashboardPage/DashboardPage.test.tsx
npm test
npm run build
```

Focused test result:

```text
Test Files  3 passed (3)
Tests       24 passed (24)
```

Full frontend regression result:

```text
Test Files  30 passed (30)
Tests       152 passed (152)
```

`npm run build` completed successfully through `tsc -b && vite build`.

There is no separate lint script in `frontend/package.json`. Type-checking is included in the successful build through `tsc -b`. Vite emitted the existing large-chunk advisory, which did not fail the build; Task 55 added no dependency.

# 12. Metric Summary Confirmation

Task 55 does not import, fetch, calculate, aggregate, or display Metric Summary.

It also does not load:

* Record Detail
* Video
* Pose Dataset
* Metric Series
* Viewer runtime
* Compare runtime

No chart or chart dependency was added.

# 13. Known Limitations

* The Record List endpoint returns the complete owned collection without server-side pagination/limit. Task 55 intentionally reuses this locked MVP behavior.
* Recent Activity uses `createdAt`, not capture time, because no authoritative `capturedAt`/`recordedAt` field is implemented.
* Client and server clock differences can affect the rolling boundary because the page uses browser `Date.now()`.
* Unknown runtime statuses require defensive casting upstream because the compile-time Record API union contains only canonical values.
* Task 57 remains responsible for full independent multi-section state and partial-success orchestration.

# 14. Task 56 Readiness and Blockers

The Dashboard component foundation can accept another section, but Task 56 — Metric Summary Trend is not data-contract ready.

Blockers preserved from Task 53:

* Record List contains no Metric Summary.
* The only current frontend Metric Summary source is Record Detail, which is forbidden for Dashboard and would create N+1 requests.
* No Dashboard aggregation endpoint is implemented.
* Persisted Metric Summary lacks unit, metric definition/calculation version, activity/movement type, and side compatibility metadata.
* No metric is currently proven safe for cross-Record trend display.

Task 56 must resolve its locked contract prerequisites before implementation. Do not continue automatically.
