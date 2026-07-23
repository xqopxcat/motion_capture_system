# Task 59 Review Checklist

## Foundation

- [x] PostgreSQL 16 remains the selected database.
- [x] psycopg 3 driver and SQLAlchemy 2.0 ORM/session foundation added.
- [x] Alembic initialized with deterministic revision `20260723_0001`.
- [x] Database settings cover environment, URL, timeout, pool, test URL and migration policy.
- [x] Production/production-like reject missing/non-PostgreSQL URLs and non-head migration policy.
- [x] Explicit release/readiness command verifies connectivity and enforces `require_head` before serving production traffic.
- [x] Importing FastAPI does not open or require a database connection in local mode.
- [x] No production ORM `create_all` path exists.

## Schema

- [x] Users and unique provider identity represented.
- [x] Durable sessions support token hash, expiry, revocation and last-used time.
- [x] Records include canonical status, capture metadata, lifecycle timestamps, failure and retry metadata.
- [x] All four Artifact types include size, content, checksum, integrity, completion, version and generation metadata.
- [x] Metric Summary and items preserve the five-part Dashboard compatibility key.
- [x] Annotation persistence preserves immutable frame/joint binding fields and author.
- [x] String public ID and timezone-aware timestamp strategy preserved.
- [x] Tags use minimal embedded JSONB; no Tag subsystem/API added.

## Integrity and deletion

- [x] Primary/foreign keys, checks, uniqueness and indexes are explicit.
- [x] Owner/status/capture, annotation, session, artifact and metric compatibility indexes exist.
- [x] Record child metadata cascades without orphans.
- [x] User deletion is restricted while owned Records/authored Annotations exist; Sessions cascade.
- [x] PostgreSQL/GCS deletion boundary is documented; no GCS cleanup implemented.
- [x] Lifecycle/object-integrity constraints owned by Tasks 62–63 are explicitly deferred.

## Tests and migrations

- [x] Deterministic factories exist for all required models.
- [x] Test database guard requires `APP_ENV=test`, PostgreSQL, and a database ending `_test`.
- [x] Unique schema foundation exists for Task 60 repository tests.
- [x] Existing and new backend tests pass: 79 passed.
- [x] Alembic offline upgrade SQL compiles to head.
- [ ] Live PostgreSQL empty bootstrap, table/index/constraint inspection, downgrade and re-upgrade executed. Blocked here because Docker/PostgreSQL is unavailable; the guarded test and exact command are provided.
- [x] Destructive downgrade is documented as test/local-only, not production-safe rollback.
- [x] No automatic seed or CLI seed added; test factories are isolated from runtime.

## Scope safety

- [x] Runtime repository classes and `runtime_repositories.py` bindings unchanged.
- [x] Service constructors and API response contracts unchanged.
- [x] No Google OAuth, cookie/session behavior, CSRF or logout implementation added.
- [x] No GCS adapter, signing, object validation or cleanup added.
- [x] No Record lifecycle transition, retry orchestration or delete API added.
- [x] No frontend file changed.
- [x] No worker, queue, WebSocket or backend Metrics Engine added.
