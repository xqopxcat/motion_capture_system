# Task 64 — Frontend Production Wiring

Status: **Implementation accepted; full camera journey is revalidated by Task 65.**

## Production Capture flow

The Capture page now performs this real sequence:

1. Browser records a Video Blob and collects pose frames.
2. User reviews the local recording and chooses **Save Record**.
3. Frontend creates an owned PostgreSQL Record.
4. Browser serializes `pose.v1`.
5. Browser calculates a compatible left-knee Metric Series and Metric Summary.
6. Browser extracts a JPEG Thumbnail from the recorded video.
7. Browser calculates lowercase SHA-256 for all four artifacts.
8. Backend returns four real GCS V4 signed PUT URLs.
9. Browser uploads directly to private GCS with the signed Content-Type and
   `x-goog-meta-sha256` header.
10. Browser calls the corresponding complete endpoint for every artifact.
11. Browser calls server finalization and waits for the synchronous Task 63
    terminal result.
12. `Ready` navigates to persisted Record Viewer.

The frontend never invents a storage path, signed URL, object generation, Record
status, or finalization result.

## Retry and visible failure

Publish progress is shown for Record creation, artifact preparation, every
upload, and finalization. Errors remain visible and never fall back to fake
storage or hard-coded data.

The in-memory page-local retry state stores only orchestration progress:

- the already-created Record ID
- which artifact completion calls succeeded
- whether Task 63 lifecycle retry is required

It does not store authentication tokens, signed URLs, or production artifact
data in localStorage. Retry skips completed artifacts and uses the explicit
Task 63 retry route before re-finalizing a retryable Failed Record.

## Real downstream consumers

- Record List reads persisted owned Records and real signed Thumbnail URLs.
- Viewer reads Record Detail, signed Video/Pose/Metric Series URLs, and
  PostgreSQL annotations.
- Annotation create/update/delete always uses backend routes.
- Compare selects persisted Ready Records and loads their signed artifacts.
- Dashboard uses persistent Record and Metric Summary aggregation APIs.
- Queries refetch on remount so returning from Capture does not show a stale
  pre-capture cache.

## Record deletion

Records UI exposes a destructive confirmation before DELETE. The UI reports
cleanup failure without optimistic removal and permits safe retry. Retryable
lifecycle failures expose Retry and re-finalize through Task 63.

Task 64 does not bypass the Task 63 GCS-first/PostgreSQL-second compensation
policy.

## Mock and fallback boundary

Removed from the application runtime path:

- `local-demo` Viewer selection
- `poseFixture` query fallback
- mock Pose and Metric Series URL recognition
- conditional rendering for `mock-storage.local`
- local annotation fixtures in Viewer
- component-level hard-coded production artifacts

Viewer fixture modules remain directly imported by unit tests only and are no
longer exported through the runtime Viewer feature entrypoint. Development login
remains explicitly guarded by both Vite development mode and
`VITE_DEV_AUTH_ENABLED=true`; production builds cannot render it.

There is no automatic application fallback. Backend/GCS/configuration failures
are user-visible failures.

## Validation

- Frontend production build passes.
- Frontend suite: 187 tests passing after production artifact tests were added.
- Backend suite remains 108 passing with 7 isolated-PostgreSQL-gated skips.
- Local backend health is OK and local frontend returns 200.
- Browser validation confirmed the production login screen, Google OAuth route,
  absence of the dev login in normal configuration, and no console errors.
- Camera permission/physical recording is intentionally a user-driven browser
  action and is included in Task 65 end-to-end release validation.

