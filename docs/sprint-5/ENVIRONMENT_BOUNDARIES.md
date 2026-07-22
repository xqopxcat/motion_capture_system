# Sprint 5 Environment Boundaries

| Environment | Database | Object storage | Authentication | Seed/test data | Mock implementations | Configuration and security |
| --- | --- | --- | --- | --- | --- | --- |
| Local development | PostgreSQL 16 by default; migrations required | Explicit local GCS adapter/emulator **or** dedicated private GCS dev bucket; selection required | Explicit development provider allowed; real Google may also be used | Empty by default; explicit environment-guarded local-only CLI fixture/seed allowed | Dev auth/storage adapter allowed only under an explicit `local` profile; in-memory repositories are not the normal runtime | Localhost CORS only; cookie may be non-Secure only on HTTP localhost; print selected adapter names; no silent fallback |
| Automated test | Isolated PostgreSQL database/schema per run for repository/integration tests; pure unit tests may inject in-memory repositories | Deterministic GCS fake/emulator with per-test namespace | Test identity/session provider; no Google network call | Factories, integration fixtures, and explicit test-only CLI fixtures only; deterministic clocks/IDs where necessary | In-memory repositories and fake signed URLs allowed only when injected by tests | Cleanup by rollback or schema/database teardown; parallel-safe namespaces; never read developer/production credentials |
| Production-like local | PostgreSQL 16 with real migrations | GCS emulator with production adapter semantics or dedicated private GCS dev bucket | Real Google OAuth preferred; isolated dev credentials permitted, mock endpoint disabled | Empty; data created through application flow; production-like mode rejects local/test fixture CLI | No in-memory repository, `mock-storage.local`, Viewer fixture fallback, or mock-login | HTTPS/reverse-proxy behavior, Secure/HttpOnly/SameSite cookie, explicit CORS and secrets; same fail-fast validation as production |
| Production | Managed PostgreSQL-compatible service at approved version | Private GCS bucket | Real Google OAuth plus durable server session | No seed; local/test CLI fixture commands must refuse to run | All runtime mocks and development providers rejected | HTTPS-only; Secure+HttpOnly cookie; explicit SameSite/domain/path; strict CORS; secret manager/env credentials; migration/config validation before serving traffic |

## 1. Required Configuration Categories

Task 59–62 must name exact variables; Task 58 locks the categories and validation behavior:

- `APP_ENV`: one of `local`, `test`, `production_like`, `production`; no inferred production mode.
- Database URL, pool limits, connect timeout, and migration/head policy.
- Auth adapter, Google client ID/secret, approved redirect URI(s), session secret/hash keys, session lifetime, and development-auth enable switch.
- GCS adapter, bucket/project/emulator endpoint, signing identity/credentials, upload/download expiry, size limits, and checksum policy.
- Frontend API base URL and allowed origins.
- Session cookie name, Secure, HttpOnly, SameSite, domain, and path policy.

Secrets must never be committed, logged, returned to the frontend, or shared between test and production.

## 2. Fail-fast Rules

The backend must refuse to start in `production` or `production_like` when:

- `database_url` is absent, invalid, or selects an in-memory implementation;
- migrations are not at the required head (policy finalized in Task 59);
- auth adapter is mock/dev, Google credentials or approved redirects are missing, or session security material is absent;
- storage adapter is not GCS, is mock/local, bucket/signing configuration is missing, or the GCS bucket is configured public;
- cookies are non-Secure in a production HTTPS deployment;
- credentialed CORS uses wildcard or an origin outside the explicit allowlist.

The frontend production build/startup must not silently default to a mock API or artifact source. Its API origin must be explicit or intentionally same-origin. A URL containing `mock-storage.local`, `local-demo`, `poseFixture`, or a fixture-only source is an error in production code paths.

## 3. Local Development Rules

- `docker-compose.yml` PostgreSQL becomes functional, not decorative.
- Local services are PostgreSQL plus the explicitly selected storage/auth dependencies. A storage emulator is allowed only if Task 62's adapter validates the same ownership, path, metadata, and integrity rules.
- There is no Dashboard demo seed, runtime seed, production seed, or UI data-generation button.
- A developer may create data through Capture or an explicit CLI fixture/seed command. Such a command must verify `APP_ENV=local`, require deliberate invocation, identify what it creates, and never run during backend/frontend startup or migrations.
- Dev auth is disabled unless both `APP_ENV=local` and a dedicated opt-in are present. It must be visually identifiable and bind only configured local origins.

## 4. Automated Test Strategy

- Unit tests inject repositories, clock, identity, and storage doubles directly; they do not mutate module-global production singletons.
- Repository/integration tests use an isolated migrated PostgreSQL target and verify constraints, transactions, ownership predicates, cascade/restrict behavior, clean bootstrap, and rollback.
- Storage contract tests run against a deterministic fake/emulator and separately smoke-test the production adapter.
- Authentication tests use a test identity provider and verify OAuth/session behavior without Google network access.
- Cleanup uses per-test transaction rollback where valid; lifecycle tests that require commits use unique schema/database namespaces and teardown.
- Fixtures must declare owner, lifecycle state, compatibility metadata, and deterministic timestamps. Tests may not depend on execution order.
- Test-only CLI fixtures must verify `APP_ENV=test`, target only the isolated test database/GCS namespace, and refuse production or production-like credentials.

## 5. Production-like Local Definition

A documented command set must start frontend, backend, migrated PostgreSQL, and GCS-compatible storage under production configuration rules. Mock login, local Viewer fallback, and CLI fixture/seed commands remain disabled. The environment must support the approved Task 65 happy path, deletion/cleanup test, restart test, cross-user test, signed-URL expiry test, and clean database bootstrap before production release.

## 6. Current Boundary Gaps

- `backend/app/core/config.py` only defines app name, CORS origins, optional `database_url`, and cookie name; it has no environment or adapter selection and does not validate production safety.
- `docker-compose.yml` starts PostgreSQL and supplies `DATABASE_URL`, but the backend imports no PostgreSQL driver/ORM and never reads the URL outside settings construction.
- `frontend/src/services/baseApi.ts` defaults the API URL to `/api`, which is acceptable only as an intentional same-origin policy; there is no environment validation.
- The current cookie is always `secure=False`, mock auth is always routed, and CORS defaults to localhost.
