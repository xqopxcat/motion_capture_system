# Sprint 4 Task 54 — Recent Records

---

| Item | Value |
| --- | --- |
| Document | SPRINT_4_TASK_54_RECENT_RECORDS.md |
| Sprint | Sprint 4 — Dashboard |
| Task | Task 54 — Recent Records |
| Status | Implemented |
| Last Updated | 2026-07-17 |

---

# 1. Purpose

Task 54 replaces the Dashboard placeholder with the Dashboard page foundation, navigation-only Quick Actions, and an owned Recent Records section.

The implementation preserves `SPRINT_4_TASK_53_DASHBOARD_SCOPE_LOCK.md` and does not implement Task 55, Task 56, or Task 57.

# 2. Implemented Behavior

## Dashboard Foundation

`/dashboard` now renders:

* Dashboard heading and supporting description
* Quick Actions
* Recent Records

No Summary Card or Metric Trend placeholder is rendered.

## Quick Actions

| Action | Route |
| --- | --- |
| Start Capture | `/capture` |
| View All Records | `/records` |
| Open Compare | `/compare` |

No Upload Record action was added because no route exists.

## Record Query and Selection

* `DashboardPage` calls `useGetRecordsQuery()` exactly once.
* The existing `GET /api/records` endpoint is the only Dashboard data request.
* `selectRecentRecords` takes the first five items without sorting, preserving the backend's newest-first `createdAt` order.
* The implementation does not call `GET /api/records/{recordId}`.
* No per-Record request or N+1 request is introduced.
* No Metric Summary or runtime artifact data is requested.

## Recent Record Metadata

Each item renders available list metadata:

* title
* formatted `createdAt`
* status
* description when present
* tags when present
* formatted duration

Thumbnail rendering is intentionally omitted. Although `thumbnailUrl` is present in the list contract, Task 54 does not need to load the image to satisfy the lightweight Recent Records boundary.

## Status and Action Mapping

| Status | Tone | Action | Destination |
| --- | --- | --- | --- |
| Ready | Ready | Open Viewer | `/records/:recordId` |
| Uploading | Neutral | View Record | `/records/:recordId` |
| Processing | Processing | View Record | `/records/:recordId` |
| Failed | Failed | View Record | `/records/:recordId` |
| Unknown | Neutral | View Record | `/records/:recordId` |

Unknown status handling is defensive presentation logic only. The canonical `RecordStatus` type and backend semantics remain unchanged.

# 3. Task 54 States

## Loading

* The Dashboard heading and Quick Actions remain visible.
* Recent Records shows a stable three-row skeleton with `aria-busy` and screen-reader loading text.
* Reduced-motion preference disables the pulse animation.

## Empty

* Explains that no Records exist yet.
* Provides Start Capture as the primary next action.
* Does not render zero metrics, Summary Cards, or Trend content.

## Error

* The failure remains inside the Recent Records section.
* A Retry button invokes the existing RTK Query `refetch` function.
* Quick Actions remain usable.
* No internal errors, storage paths, tokens, signed URLs, or stack traces are rendered.

This is the Task 54 Record-section state boundary, not Task 57 multi-section partial-success orchestration.

# 4. Responsive Behavior

## Desktop

* Centered content with a 1060px maximum width.
* Three-column Quick Action grid.
* Compact Record layout with content, metadata, and action columns.

## Tablet

* Quick Actions wrap into two columns.
* Record metadata moves to its own row.
* Record action remains visible.

## Mobile

* Single-column Quick Actions and Record layout.
* Metadata stacks vertically.
* Record action expands to available width.
* Long titles, descriptions, tags, dates, and status labels wrap.
* `min-width: 0` and page overflow controls prevent horizontal scrolling.

# 5. Component Boundaries

```text
DashboardPage
└── DashboardContent
    ├── QuickActions
    └── RecentRecordsSection
        ├── RecentRecordsLoading
        ├── RecentRecordsEmpty
        ├── RecentRecordsError
        │   └── RetryButton
        └── RecentRecordItem
```

Small pure Dashboard Record helpers are isolated in `features/dashboard/dashboardRecentRecords.ts`.

# 6. Existing APIs and Utilities Reused

* `useGetRecordsQuery`
* `GET /api/records`
* `RecordListItem`
* `formatRecordDate`
* `formatRecordDuration`
* `getRecordStatusMeta`
* `buildRecordViewerPath`
* React Router `Link`

# 7. Files Changed

## Created

* `frontend/src/features/dashboard/dashboardRecentRecords.ts`
* `frontend/src/features/dashboard/dashboardRecentRecords.test.ts`
* `frontend/src/features/dashboard/index.ts`
* `frontend/src/pages/DashboardPage/DashboardPage.module.css`
* `frontend/src/pages/DashboardPage/DashboardPage.test.tsx`
* `docs/SPRINT_4_TASK_54_RECENT_RECORDS.md`

## Modified

* `frontend/src/pages/DashboardPage/DashboardPage.tsx`

No backend file, API contract, Record type, auth behavior, ownership behavior, or unrelated page was modified.

# 8. Test Coverage

Focused Vitest coverage includes:

* first-five selection
* preservation of input/newest-first order
* Ready, Uploading, Processing, and Failed action mapping
* defensive unknown-status neutral mapping
* encoded `/records/:recordId` destination
* all three Quick Action routes
* stable loading presentation with visible Quick Actions
* empty state and Start Capture action
* section-level error with visible Quick Actions
* Retry callback wiring
* absence of Metric Summary and runtime control content

The implementation imports only `useGetRecordsQuery` from the Record service. It does not import or invoke Record Detail, Metric Summary, pose, video, Metric Series, Viewer runtime, or Compare runtime loaders.

# 9. Validation

Commands:

```text
npm test -- --run src/features/dashboard/dashboardRecentRecords.test.ts src/pages/DashboardPage/DashboardPage.test.tsx
npm test
npm run build
```

Focused result at implementation time:

```text
Test Files  2 passed (2)
Tests       13 passed (13)
```

Full frontend regression result:

```text
Test Files  29 passed (29)
Tests       141 passed (141)
```

`npm run build` completed successfully through `tsc -b && vite build`. Vite reported the existing large-chunk advisory; it did not fail the build and Task 54 adds no chart or other dependency.

# 10. Deviations from Task 53

None.

The implementation displays five newest-first Record Metadata items, uses one existing Record List query, omits Upload Record, avoids N+1 requests, and does not load or display Metric Summary/runtime data.

# 11. Known Limitations

* `GET /api/records` has no server-side limit, so the client receives the complete owned list before selecting five. This was accepted and locked by Task 53 for Task 54.
* `duration` is currently returned as `null` by the backend and is displayed through the existing `Pending` formatter behavior.
* `createdAt` is the only implemented date field and may differ from actual capture time.
* No standalone Upload Record route exists.
* Shared Record cards, badges, and state components do not yet exist; Task 54 keeps its components local rather than performing an unrelated design-system refactor.
* Task 57 remains responsible for full multi-section loading/error/partial-success orchestration.

# 12. Task 55 Readiness

Task 54 is complete and the Dashboard foundation is ready for Task 55 — Summary Cards.

Task 55 must follow the Task 53 locked definitions and must not infer cross-Record Metric Summary compatibility. Do not continue automatically.
