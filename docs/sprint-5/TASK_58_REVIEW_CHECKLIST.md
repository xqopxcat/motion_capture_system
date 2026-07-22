# Task 58 Review Checklist

## Inventory completeness

- [x] All backend repository implementations were inspected.
- [x] Actual default runtime bindings in `runtime_repositories.py` and service constructors were verified.
- [x] User, session, Record, Artifact, Metric Summary, and Annotation restart-sensitive state was documented.
- [x] Mock Google/dev login, fixed users, cookie behavior, and frontend mock login UI were located.
- [x] Fake upload/download URL generation and canonical path helpers were inspected.
- [x] Frontend Viewer, Pose, Metric Series, Thumbnail, Annotation, Compare, Capture, and upload fallbacks/placeholders were included.
- [x] Dashboard summary generation and compatibility grouping were traced.
- [x] Development seed-data search was performed; no approved seed system exists.
- [x] Test-only fixtures were distinguished from application-reachable fixtures and module-global runtime state.
- [x] Environment variables, Compose services, dependency manifests, and missing fail-fast boundaries were reviewed.

## Contracts and boundaries

- [x] API routes and Pydantic request/response schemas were reviewed.
- [x] Service and repository call boundaries were reviewed.
- [x] Frontend RTK Query endpoint responsibilities were reviewed.
- [x] Record status values and actual transition behavior were compared.
- [x] Ownership for Records, uploads, annotations, Dashboard, Viewer, and Compare was reviewed.
- [x] Contracts that can remain unchanged are listed.
- [x] Minimal likely extensions include exact impact and owner task.
- [x] Ambiguities and human-owned blockers are identified without prematurely redesigning the API.

## Production locks

- [x] Local development, automated test, production-like local, and production behavior is defined.
- [x] Production mock rejection and startup fail-fast requirements are documented.
- [x] In-memory repositories are restricted to injected unit-test use.
- [x] Test factories/fixtures are allowed while demo/manual-QA/production seeds are prohibited.
- [x] Browser analysis and backend processing/finalization boundaries are locked.
- [x] Sprint 5 non-goals are explicit, including no worker, queue, backend Metrics Engine, Kubernetes, or UI redesign.
- [x] Task 65 backup/restore is limited to an MVP smoke test.

## Gap assignment

- [x] Task 59 owns PostgreSQL schema, constraints, migrations, clean bootstrap, rollback, and test DB foundations.
- [x] Task 60 owns persistent repositories, query-level ownership, transactions, and Dashboard persistence/query.
- [x] Task 61 owns Google OAuth, sessions, cookie/CSRF security, and production rejection of mock login.
- [x] Task 62 owns all four artifacts, private storage, signed URLs, integrity, existence, expiry, and cleanup.
- [x] Task 63 owns server-controlled lifecycle, validation, idempotency, failure/retry, and processing boundary.
- [x] Task 64 owns complete frontend wiring and removal of production runtime fallbacks while retaining test doubles.
- [x] Task 65 owns production E2E/restart/isolation/release validation rather than an implementation gap.

## Change safety

- [x] No PostgreSQL model or migration was implemented.
- [x] No repository binding was replaced.
- [x] No OAuth or object-storage integration was added.
- [x] No runtime mock was removed.
- [x] No frontend behavior or product feature was changed.
- [x] No API contract was changed.
- [x] Only the five Task 58 documents were created.

## Reviewer decisions required before acceptance

- [ ] Approve Production MVP scope and Definition of Done.
- [ ] Approve environment matrix and local adapter policy.
- [ ] Confirm production object-store choice and credential owner.
- [ ] Confirm Google OAuth domains/redirects and credential owner.
- [ ] Decide whether Record deletion/retention belongs in Production MVP.
- [ ] Approve Task 63 synchronous/observable Processing and Failed retry semantics before implementation.
- [ ] Confirm recommended execution order: 59 → 60 → 61 and 62 (parallel after foundations) → 63 → 64 → 65.
