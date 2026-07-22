# Task 58 Review Checklist

## Inventory completeness

- [x] All backend repository implementations were inspected.
- [x] Actual default runtime bindings in `runtime_repositories.py` and service constructors were verified.
- [x] User, session, Record, Artifact, Metric Summary, and Annotation restart-sensitive state was documented.
- [x] Mock Google/dev login, fixed users, cookie behavior, and frontend mock login UI were located.
- [x] Fake upload/download URL generation and canonical path helpers were inspected.
- [x] Frontend Viewer, Pose, Metric Series, Thumbnail, Annotation, Compare, Capture, and upload fallbacks/placeholders were included.
- [x] Dashboard summary generation and compatibility grouping were traced.
- [x] Development seed-data search was performed; no seed system currently exists, and guarded local/test-only CLI fixtures are now approved as the sole seed mechanism.
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
- [x] Test factories and explicit local/test-only CLI fixtures/seeds are allowed; runtime/demo/production seeds and UI data buttons are prohibited.
- [x] Browser analysis and backend processing/finalization boundaries are locked.
- [x] Sprint 5 non-goals are explicit, including no worker, queue, backend Metrics Engine, Kubernetes, or UI redesign.
- [x] Task 65 backup/restore is limited to an MVP smoke test.
- [x] Task 65 is formally approved as the Sprint 5 release-validation gate, including Record deletion and GCS cleanup validation.

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

## Reviewer decisions

- [x] Production MVP scope and Definition of Done approved.
- [x] Environment matrix approved, including explicit environment-guarded local/test-only CLI fixture/seed policy.
- [x] Production object-store choice locked to private GCS; no alternative production provider is permitted without a new scope decision.
- [ ] Supply/confirm the GCS project, bucket, region, service identity, credential owner, and retention settings before Task 62 acceptance.
- [ ] Confirm Google OAuth domains/redirects and credential owner.
- [x] Record deletion is included in Production MVP and must clean up PostgreSQL relationships and all four GCS artifacts with observable retryable failure handling.
- [ ] Approve Task 63 synchronous/observable Processing and Failed retry semantics before implementation.
- [x] Task 65 Production MVP End-to-End Validation is formally approved.
- [x] Recommended execution order approved: 59 → 60 → 61 and 62 (parallel after foundations) → 63 → 64 → 65.
