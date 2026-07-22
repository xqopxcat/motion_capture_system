# Sprint 5 — Production MVP Integration Scope

| Item | Value |
| --- | --- |
| Task | 58 — Production MVP Scope Lock |
| Status | Locked for review |
| Evidence date | 2026-07-23 |
| Implementation tasks | 59–64 |
| Validation task | 65 |

## 1. Objective

Sprint 5 converts the already-built product contracts and UI capabilities into one production-capable MVP. A capability is not complete when only its interface, screen, or test double exists. The normal production path must use durable PostgreSQL state, production authentication, private object storage, server-enforced ownership, and an end-to-end frontend workflow.

Task 58 is documentation and inventory only. It does not implement any production integration or change runtime behavior.

## 2. Production MVP Definition

The Production MVP is complete when a new user can authenticate, capture a motion sample in the browser, create an owned Record, upload Video/Pose/Metric Series/Thumbnail artifacts through authorized signed URLs, persist a compatible Metric Summary, finalize the Record through the server-owned lifecycle, and use the persisted Record in Record List, Viewer, Annotation, Compare, and Dashboard. Logout/login and backend/database restarts must not lose data. A second user must not discover, mutate, upload to, download from, annotate, compare, or aggregate the first user's resources.

Browser analysis remains authoritative for Pose Dataset and Metric Series production in this Sprint. Backend `Processing` means validation/finalization of uploaded browser-produced artifacts and metadata; it does not authorize a server Metrics Engine, worker, or queue.

## 3. In-Scope Resources and Capabilities

- Users and server-side authentication sessions.
- Records, ownership, status, failure metadata, lifecycle timestamps, and audit timestamps.
- Artifact metadata for Video, Pose, Metric Series, and Thumbnail, including owner-through-Record, canonical path, content type, size, checksum/integrity state, completion state, and timestamps.
- Metric Summary items and compatibility dimensions: metric ID, unit, metric definition/calculation version, activity type, and side.
- Annotations and author/Record ownership.
- PostgreSQL schema, constraints, migrations, clean bootstrap, rollback verification, repositories, transactions, and test isolation.
- Private production object storage, signed upload/download URLs, existence/integrity checks, expiration, deletion, and partial-upload cleanup.
- Real Google OAuth for production; isolated test identities and explicitly enabled local development authentication.
- Server-authoritative lifecycle: `Uploading → Processing → Ready` or `Failed`.
- Full frontend wiring from Capture through Dashboard with visible, retryable error states and no silent mock fallback.
- Production configuration validation, secure cookie/CORS policy, and startup fail-fast behavior.

## 4. Locked Runtime Rules

1. Production and production-like runtime use PostgreSQL; `database_url` may not be ignored.
2. Production uses the Task 62 private object-storage adapter. `mock-storage.local` is forbidden.
3. Production uses real Google OAuth and durable/revocable sessions. `/auth/mock-login` and provider `dev` are unavailable.
4. In-memory repositories, fake signed URLs, local Viewer fixtures, hard-coded users, and fake uploads are test dependencies only unless an explicitly selected local adapter is allowed by `ENVIRONMENT_BOUNDARIES.md`.
5. No fallback is silent. A missing or contradictory production configuration fails application startup.
6. Ownership is constrained in repository queries and storage authorization, not only filtered after loading.
7. Existing API shapes are preserved where they can express the production behavior. Necessary extensions are additive and owned by a later task.
8. No Dashboard demo seed, manual-QA fake records, production seed, or UI test-data button is permitted.

## 5. Architectural Principles

- Keep Router → Service → Repository boundaries and inject concrete adapters at application startup.
- Make transaction boundaries explicit for multi-resource completion/finalization.
- Store object bytes in object storage and durable metadata in PostgreSQL; never store signed URLs as durable values.
- Canonical object paths remain server-owned and include an ownership-safe namespace decided by Task 62.
- Treat complete/finalize operations as idempotent. Verify object existence and declared integrity before accepting completion.
- Treat `Ready` as a server-derived outcome, never a frontend-selected value.
- Preserve browser-owned capture, pose inference, and metric calculation boundaries.
- Keep unit-test doubles cheap and deterministic; production safety must not make tests depend on Google or cloud storage.

## 6. Assumptions

- PostgreSQL 16 remains the target database already present in `docker-compose.yml`.
- GCS is the preferred production object store unless Task 62 records an explicitly approved equivalent.
- Current `pose.v1` and Metric Series artifact formats remain unchanged.
- Metric Summary calculation remains in the browser; the backend validates and persists the submitted summary and compatibility metadata.
- Current Record status strings remain canonical.
- Deployment-platform selection is outside this Task; environment contracts must remain platform-neutral.

## 7. Explicit Non-goals

- Full or backend Metrics Engine, GPU processing, distributed workers/job queues, or WebSocket progress.
- Kubernetes, multi-region disaster recovery, PITR automation, CDN optimization, or advanced analytics pipelines.
- Multi-tenant organizations, billing/subscriptions, admin console, real-time collaborative annotations, or mobile apps.
- Unrelated UI redesign, new product features, new Record statuses, or a second artifact schema.
- Dashboard demo data, production seed data, automatic backup scheduling, or a full disaster-recovery platform.

## 8. Compatibility Expectations

The following are compatibility targets: API route families, camelCase JSON fields, Record statuses, current-user cookie semantics, owned-resource 404 behavior, RTK Query endpoint responsibilities, canonical artifact types, Metric Summary compatibility fields, and annotation CRUD shapes. Additive fields needed for integrity/lifecycle are documented in `PRODUCTION_CONTRACT_DECISIONS.md`; breaking changes require separate approval.

## 9. Task Completion Criteria

### Task 59 — PostgreSQL & Migrations

- Users, sessions, Records, Artifacts, Metric Summaries/items, and Annotations have constrained durable models.
- Compatibility metadata, failure metadata, lifecycle timestamps, `createdAt`/`updatedAt`, uniqueness, and delete policies are explicit.
- Migrations bootstrap a clean database and have a tested rollback path.
- Test factories/fixtures exist without demo or production seeds.

### Task 60 — Persistent Repositories

- Normal local, production-like, and production bindings use PostgreSQL.
- In-memory repositories are test-only.
- Ownership is part of queries; transaction boundaries are documented and tested.
- Dashboard uses a persistent aggregation/query boundary without N+1 loading.
- Backend restart preserves state.

### Task 61 — Production Authentication

- Google OAuth and server-side session lifecycle are real in production.
- Local/test providers are explicit and cannot be enabled by ordinary production configuration.
- Cookie, OAuth state/nonce, redirect allowlist, CSRF, logout, expiration, and revocation follow the chosen session architecture.

### Task 62 — Production Artifact Storage

- Private storage supports all four artifacts with real signed upload/download URLs.
- Content type, size, checksum/integrity, existence, ownership, expiry, deletion, partial cleanup, and error mapping are enforced.
- No production request can return `mock-storage.local` or silently use a local fixture.

### Task 63 — Processing & Record Lifecycle

- Required artifacts and Metric Summary compatibility are validated transactionally.
- Valid/invalid transitions, idempotent completion/finalize, duplicate requests, timeout, retry, rollback, partial failure, and failure reason are defined and tested.
- Browser analysis/backend finalization boundary is preserved; no worker or queue is introduced.

### Task 64 — Frontend Production Wiring

- Capture creates a Record, uploads all artifacts with signed URLs, reports completion, finalizes, waits/polls for terminal state as defined by Task 63, and routes to persisted Records.
- Viewer, Annotation, Compare, and Dashboard consume real persisted data and signed URLs.
- Production runtime mocks, hard-coded data, and silent fallbacks are removed; test doubles remain isolated.
- Invalid production configuration fails fast and upload/lifecycle failures are visible and retryable.

### Task 65 — Production MVP End-to-End Validation

- Validate the full user journey, second-user isolation, logout/login, backend/database restart persistence, URL expiry, clean migration, builds, startup, and release checklist.
- Perform only an MVP PostgreSQL dump/restore smoke test with documented commands and basic integrity checks; do not build a DR platform.

## 10. Sprint 5 Definition of Done

- Tasks 58–65 are accepted and their review checklists pass.
- The complete Production MVP definition in Section 2 works without production runtime mocks.
- Database and object state survive relevant service restarts; ownership isolation is verified end to end.
- Production startup rejects mock auth/storage/repositories, missing credentials, unsafe cookie/CORS combinations, and unapplied migrations.
- Frontend build and backend/frontend automated suites pass, including integration and production-like smoke tests.
- Release, migration, rollback, backup/restore-smoke, configuration, and operational-error instructions are documented.
- No Sprint 5 non-goal was introduced.
