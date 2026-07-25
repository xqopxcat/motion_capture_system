# Task 65 — Production MVP End-to-End Validation

Status: **Application/runtime validation approved; deployment configuration
remains a conditional release gate.**

## Purpose

Task 65 validates that the Production MVP works through its real runtime path.
Passing component tests or rendering production-shaped UI is not sufficient.
PostgreSQL, Google OAuth, private GCS artifacts, lifecycle rules, frontend
consumers, restart persistence, ownership isolation, and operational commands
must be validated together.

## Required user journey

1. A new user signs in with live Google OAuth.
2. Capture records browser video and pose data.
3. The frontend creates an owned Record.
4. Video, Pose, Metric Series, and Thumbnail upload through real GCS signed
   URLs.
5. Completion/finalization reaches `Ready`.
6. Record List shows the persisted Record.
7. Viewer loads real signed artifacts and synchronizes video/pose playback.
8. Annotation create, update, reload, and delete persist through PostgreSQL.
9. Compare loads two owned Ready Records.
10. Dashboard reflects persistent Records and compatible Metric Summaries.
11. Logout revokes the server session; login restores access to owned data.
12. Backend and database restarts do not lose durable data.

## Required negative and operational validation

- A second user cannot read, annotate, compare, finalize, retry, or delete the
  first user's Record.
- Signed URLs expire and are not treated as durable application URLs.
- Owned Record deletion removes PostgreSQL relationships and all owned GCS
  objects.
- Partial GCS cleanup remains observable and retryable.
- A clean database reaches Alembic head and the backend starts against it.
- Frontend tests and production build pass.
- Backend tests, PostgreSQL integration tests, readiness, and startup pass.
- Auth maintenance CLI preserves active sessions and removes only retained
  expired/revoked history in bounded batches.
- PostgreSQL dump/restore succeeds into a clean target and basic row integrity
  is confirmed.

## Explicit limits

- Backup/restore is an MVP smoke test, not automated backup scheduling, PITR,
  multi-region disaster recovery, or a DR platform.
- Browser analysis remains the approved Task 63 boundary. This task does not
  add a worker, queue, or backend Metrics Engine.
- Capture quality optimization is tracked separately in
  `docs/CAPTURE_QUALITY_OPTIMIZATION_BACKLOG.md`.

## Evidence policy

Every checklist item is recorded as `Pass`, `Fail`, `Blocked`, or `Pending`.
Automated tests may prove contracts and negative cases, but may not replace the
live Google OAuth, physical camera, real GCS upload, or user-visible browser
journey. Secrets, raw session tokens, Google tokens, and signed URL query
strings must not be copied into evidence.

## Auth cleanup command

Dry-run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m scripts.cleanup_auth_data `
  --confirm-app-env local `
  --batch-size 500
```

Execute:

```powershell
cd backend
.\.venv\Scripts\python.exe -m scripts.cleanup_auth_data `
  --confirm-app-env local `
  --batch-size 500 `
  --execute
```

Production deployments must substitute `production`, inject configuration
without printing secrets, and use the deployment platform's native daily
scheduler. Automatic cleanup during application startup is forbidden.

## Current evidence

- Backend unit/API suite: `109 passed, 8 skipped`.
- Live PostgreSQL repository suite: `7 passed`.
- Auth cleanup dry-run: 3 eligible OAuth attempts, 0 sessions.
- Auth cleanup execution: 3 OAuth attempts removed, 0 sessions removed.
- Active-session retention is covered by the live PostgreSQL integration test.
- Frontend suite: `188 passed`.
- Frontend production build: passed (`168 modules transformed`).
- Current PostgreSQL readiness: connected and at Alembic head
  `20260724_0002`.
- Clean-database creation attempt: safely blocked because the application
  database role does not have `CREATEDB`; no existing database was changed.
- Live Google OAuth callback returned to the protected Dashboard.
- The validated Google account maps to one internal Google User and one
  distinct provider subject; raw provider subject and tokens were not emitted.
- Backend restart preserved the authenticated server session and the 3
  persisted Ready Records visible on Dashboard.
- Physical-camera Capture produced 396 pose frames over a 26-second recording.
- `Task 65 E2E 2026-07-26` finalized Ready with all four artifact types and
  appeared in Record List, Viewer, Compare, Recent Records, and compatible
  Dashboard history.
- Annotation create, update, reload persistence, and delete passed.
- Logout returned to `/login`; PostgreSQL aggregate counts confirmed one
  additional revoked session and one unrelated active session remained.
- Live Google re-login restored the same owned data.
- Signed upload/download, metadata integrity, one-second signed URL expiry,
  generation-bound deletion, and post-delete absence passed against live GCS.
- Owned test Record deletion removed the PostgreSQL Record and every child row
  and left zero objects under its canonical GCS prefix.
- PostgreSQL custom-format dump succeeded; `pg_restore --list` read 70 archive
  TOC entries. Restore remains pending because the `motion` runtime role is
  intentionally neither superuser nor `CREATEDB`.
- After an administrator created two empty targets, clean bootstrap migrated
  from zero to `20260724_0002` and an isolated backend started successfully on
  port 8001 with health `ok`.
- Restore completed with 1 User, 4 Records, 16 Artifacts, 4 Metric Summaries,
  and 0 Annotations. Tested owner/parent orphan counts were all zero.
- After an administrator restarted PostgreSQL 16, the original database
  remained at Alembic head with 3 Records, 12 Artifacts, active sessions, and
  authenticated browser access intact.
- Live second-user isolation passed: the second Google User saw an empty
  Dashboard and Record List, while direct first-user Record Detail and
  Annotation requests returned non-disclosing 404. Database aggregation
  confirmed two Google Users/two distinct subjects with owned Record counts 0
  and 3. Mutation denial remains covered by the API/PostgreSQL integration
  suites without extracting the HttpOnly browser session.

## Defects found

- **Fixed and live revalidated:** Capture now navigates directly to the
  persisted Viewer after Ready.
- **Fixed and live revalidated for new Records:** Capture persists pose duration
  and FPS during Record creation. PostgreSQL stored `12.689` seconds and `30`
  FPS for the verification Record; Record List rendered `12.7s`. Existing
  Records created before the fix remain null and are not silently backfilled.

Final reviewer decision: the Production MVP application/runtime path is
approved. A real production deployment remains blocked until the deployment
platform's scheduler and production-only configuration are supplied and
reviewed as required by `TASK_65_RELEASE_RUNBOOK.md`.
