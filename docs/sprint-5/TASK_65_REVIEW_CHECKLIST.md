# Task 65 Review Checklist

Status values: **Pass / Fail / Blocked / Pending**

## Build, schema, and startup

- [x] Pass — backend complete test suite (`109 passed`; PostgreSQL-gated tests
  run separately)
- [x] Pass — live PostgreSQL integration suite (`7 passed`)
- [x] Pass — frontend complete test suite (`188 passed`)
- [x] Pass — frontend production build (`168 modules transformed`)
- [x] Pass — administrator-created empty bootstrap DB migrated from zero to
  Alembic head `20260724_0002`
- [x] Pass — backend readiness and isolated port 8001 startup succeeded against
  the clean bootstrap DB
- [x] Pass — current PostgreSQL readiness is at Alembic head
  (`20260724_0002`)
- [x] Pass — configuration tests prove production/prod-like reject missing
  PostgreSQL, non-head migration policy, mock/dev auth, fake storage, insecure
  cookies, and invalid origin/callback allowlists

## Live user journey

- [x] Pass — live Google OAuth start/callback returned to protected Dashboard
- [x] Pass — database aggregation confirms one Google User and one distinct
  provider subject for the validated account (raw `sub` not logged)
- [x] Pass — physical-camera Capture produced a 26-second recording and 396
  pose frames
- [x] Pass — real GCS upload completed for Video, Pose, Metric Series, and
  Thumbnail; PostgreSQL records all four completed artifact types
- [x] Pass — finalize reached Ready
- [x] Pass — persisted Record List includes `Task 65 E2E 2026-07-26`
- [x] Pass — Viewer loaded video, 396 pose frames, and metric series; playback
  advanced the rendered frame
- [x] Pass — Annotation create/update/reload/delete
- [x] Pass — Compare loaded two owned Ready Records with video, pose, and metric
  series
- [x] Pass — Dashboard loaded 3 persisted Ready Records and compatible metric
  trend after live login
- [x] Pass — logout revoked the current server session; live Google re-login
  restored access to the same 4 owned Records

## Persistence, isolation, and cleanup

- [x] Pass — backend restart preserved the PostgreSQL session and Dashboard data
- [x] Pass — administrator restarted PostgreSQL Windows service; Alembic head,
  backend health, 3 Records, 12 Artifacts, active sessions, and authenticated
  browser access persisted
- [x] Pass — live second Google User sees 0 Records; direct first-user Record
  Detail and Annotation reads return non-disclosing 404; cross-user
  finalize/retry/delete denial is covered by API/PostgreSQL integration tests
- [x] Pass — isolated live GCS smoke rejected a 1-second expired signed URL
- [x] Pass — owned test Record deletion removed the Record and all Artifact,
  Metric Summary, and Annotation rows plus all four GCS objects
- [x] Pass — partial cleanup failure is observable and retryable in the Task 63
  automated suite
- [x] Pass — auth cleanup dry-run and bounded execution
- [x] Pass — active sessions retained by cleanup
- [ ] Conditional deployment gate — deployment platform is not selected;
  release runbook requires its native daily scheduler before any production
  deployment. Manual guarded execution and unintended-environment refusal pass.

## Operations

- [x] Pass — PostgreSQL custom-format dump succeeds and `pg_restore --list`
  reads all 70 TOC entries
- [x] Pass — custom-format archive restored into an administrator-created clean
  target
- [x] Pass — restored counts are 1 User, 4 Records, 16 Artifacts, 4 Metric
  Summaries, and 0 Annotations; tested relationship orphan counts are all zero
- [x] Pass — release configuration and credential checklist documented
- [x] Pass — migration/rollback operating instructions documented
- [x] Pass — production startup commands documented

Reviewer decision: **Task 65 Production MVP application/runtime validation
approved. Production deployment is not approved until a deployment platform is
selected and its native daily auth-cleanup scheduler plus production
secrets/origins/cookie settings are configured and reviewed.**
