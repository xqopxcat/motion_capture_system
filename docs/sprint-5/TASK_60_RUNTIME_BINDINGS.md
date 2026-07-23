# Task 60 — Runtime Bindings

| Environment | Repository adapter | Database | Mock/in-memory rule | Startup behavior |
|---|---|---|---|---|
| test | explicit `in_memory` for unit tests; PostgreSQL for repository/integration tests | isolated test transaction or guarded test DB | allowed only through test dependency override/factory | tests choose binding explicitly |
| local development | `postgresql` | configured local PostgreSQL | runtime in-memory fallback forbidden | fail if DB is unavailable; enforce/warn migration policy from config |
| staging | `postgresql` | managed/configured PostgreSQL | forbidden | fail on missing DB, failed connectivity or non-head migration |
| production | `postgresql` | production PostgreSQL | forbidden | fail on missing DB, failed connectivity or non-head migration |

## Binding path

FastAPI request dependency → request SQLAlchemy Session → PostgreSQL repository bundle → service → route.

The engine and Session factory are cached only as infrastructure factories. No mutable repository singleton or import-time database connection exists.

`REPOSITORY_ADAPTER=in_memory` is accepted only when `APP_ENV=test`. An invalid or missing normal-runtime PostgreSQL configuration fails fast; it never silently falls back to mocks.

No runtime/demo/production seed is introduced. Explicit CLI fixtures may be added later only for local/test use with environment guards, per the approved Task 58 decision.

