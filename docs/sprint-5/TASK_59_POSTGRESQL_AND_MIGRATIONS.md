# Task 59 — PostgreSQL & Migrations

## Objective and outcome

Task 59 establishes the durable PostgreSQL 16 schema and database tooling for the Production MVP without changing any runtime repository binding. SQLAlchemy models, psycopg connectivity, Alembic migration history, database readiness/version helpers, configuration validation, test safety guards, and deterministic model factories are now present.

## Technologies selected

- SQLAlchemy 2.0 declarative ORM and engine/session primitives.
- psycopg 3 with binary distribution for PostgreSQL connectivity.
- Alembic for deterministic, versioned migrations.
- PostgreSQL 16; SQLite is rejected by configuration and test guards.
- Pytest for model/config tests and opt-in PostgreSQL migration integration tests.

## Database architecture

`app.db` owns metadata naming, engine creation, session/unit-of-work primitives, readiness/version inspection, and destructive-test target validation. `app.models` owns durable mappings. Alembic owns schema creation and rollback. No application import opens a connection; engines are created only by an explicit call. No production code calls ORM `create_all`.

The current in-memory repositories and service constructors remain untouched. Task 60 will implement repositories using this foundation and decide application-lifetime engine/session injection.

## Files and modules added or changed

- `backend/app/core/config.py`: environment and database settings validation.
- `backend/app/db/`: Base, engine, session scope, revision and test-safety helpers.
- `backend/scripts/check_database.py`: explicit release/readiness command for connectivity and migration policy.
- `backend/app/models/`: User, AuthSession, Record, Artifact, MetricSummary/Item, Annotation.
- `backend/alembic.ini`, `backend/migrations/`: Alembic environment and initial revision `20260723_0001`.
- `backend/app/tests/factories.py`: deterministic valid model graphs.
- `backend/app/tests/test_database_*.py`, `test_postgresql_migrations.py`: foundation tests.
- `backend/requirements.txt`: SQLAlchemy, Alembic, psycopg.
- `.env.example`: non-secret database configuration example.

## Environment behavior

- `local`: importing the app may omit `DATABASE_URL`; explicit database operations require it. If supplied it must be PostgreSQL.
- `test`: PostgreSQL integration targets must use `TEST_DATABASE_URL`, `APP_ENV=test`, and a database name ending `_test`.
- `production_like` and `production`: require PostgreSQL `DATABASE_URL` and `MIGRATION_POLICY=require_head`; SQLite/in-memory/missing URLs fail settings construction. Deployment must run `check_database.py` before serving traffic; Task 60 may additionally invoke the same helper during application lifespan startup.
- No connection occurs at import time. Task 60 will activate the database-bound runtime path and Task 65 will validate production startup end to end.

## Test strategy

- Metadata tests verify required tables, foreign-key delete rules, uniqueness, compatibility indexes, owner indexes, and factory relationship graphs without a database.
- Configuration tests verify production fail-fast and destructive-test target safety.
- Migration integration uses a dedicated externally provisioned PostgreSQL database whose name ends `_test`. It is deliberately opt-in with `RUN_POSTGRES_MIGRATION_TESTS=1` and runs downgrade/upgrade destructively, so CI must serialize that job.
- `validate_test_database_target` also provides unique schema names for future Task 60 repository integration tests; those tests should use per-run schemas and transaction rollback.
- Existing in-memory API tests continue unchanged.

## Boundaries with Tasks 60–63

- Task 60: persistent repository CRUD, owner-scoped SQL, transaction usage, Dashboard query, runtime binding.
- Task 61: OAuth, cookie/session issuance/validation/revocation behavior.
- Task 62: GCS signing, object metadata validation, existence/integrity, and object deletion.
- Task 63: lifecycle transitions, idempotency, retry, Record delete ordering and PostgreSQL/GCS compensation.

## Known limitations and deferred rules

- PostgreSQL cannot atomically delete GCS objects. Child metadata uses database cascade, but Tasks 62–63 must ensure GCS cleanup before/with a retryable deletion workflow.
- Lifecycle consistency across timestamps/status is intentionally not fully constrained; Task 63 owns transition semantics.
- Artifact checksum algorithms and completion/integrity state transitions are represented but not restricted to a final algorithm list until Task 62.
- Compatibility dimensions remain nullable to preserve the current API. PostgreSQL 15+ `NULLS NOT DISTINCT` uniqueness prevents duplicate compatibility items even when dimensions are null.
- No CLI seed command was added; deterministic Python factories meet Task 59 test construction needs. Any future CLI fixture must follow the approved local/test guard policy.

## Completion evidence

- Backend suite: `79 passed, 1 skipped`; the skipped test is the explicitly gated live-PostgreSQL migration cycle.
- Alembic offline `upgrade head --sql` compiles the initial revision without connecting.
- FastAPI import remains database-independent.
- Live clean bootstrap/downgrade/re-upgrade was not executable in this environment because Docker/PostgreSQL is unavailable. Exact validation commands are in the runbook.
