# Sprint 5 Production Contract Decisions

## 1. Contracts Preserved

| Contract | Decision | Reason / owner |
| --- | --- | --- |
| `POST /api/records`, `GET /api/records`, `GET /api/records/{id}` | Preserve route and existing response fields | Sufficient as the main Record boundary; Task 60 changes implementation |
| `POST /api/uploads/{video,pose,metrics,thumbnail}` | Preserve route and signed-upload response shape | Real signer can replace fake signer; Task 62 |
| `POST /api/uploads/{type}/complete` | Preserve route family and current core fields | Requires additive integrity/lifecycle rules below; Tasks 62–63 |
| `POST /api/records/{id}/complete` | Preserve route | Becomes idempotent server finalization; Task 63 |
| Annotation CRUD routes and schemas | Preserve | Ownership semantics already use owned-Record 404; Task 60 persists them |
| `GET /api/dashboard/summary` | Preserve response | Compatibility grouping already has explicit dimensions; Task 60 makes query persistent/efficient |
| `GET /api/me`, `POST /api/auth/logout` | Preserve | Provider implementation changes; Task 61 |
| Record statuses | Preserve `Uploading`, `Processing`, `Ready`, `Failed` | Task 63 supplies real transitions, no new status |
| Owned-resource denial | Preserve non-disclosing 404 | Apply in DB/storage queries; Tasks 60 and 62 |
| RTK Query endpoint responsibilities | Preserve where present | Task 64 orchestrates them instead of redesigning them |
| Artifact types and canonical format names | Preserve Video/Pose/Metrics/Thumbnail and `pose.v1`/Metric Series conventions | Task 62 may harden path namespace without changing public artifact type |

## 2. Minimal Extensions Likely Required

| Limitation | Minimal decision | Backend impact | Frontend impact | Tests/migration | Owner |
| --- | --- | --- | --- | --- | --- |
| Upload requests declare content type/size inconsistently and completion has no checksum | Add size/checksum fields where missing and require expected checksum/integrity metadata; exact algorithm locked before implementation | upload schemas/service, artifact model/repository, storage adapter | upload pipeline computes/sends checksum and handles mismatch | schema migration; upload/storage contract tests | 62 |
| Record responses expose no failure reason or lifecycle timestamps | Add optional, backward-compatible failure metadata and timestamps needed by status UI/operations | Record model/schema/service | display actionable Failed/Processing state; tolerate absence during rollout | Record migration and lifecycle/UI tests | 59/63/64 |
| `FinalizeRecordResponse` can only express `Ready` | Either finalize synchronously and preserve it, or additively return current `Processing/Ready/Failed` state; decide from Task 63 transaction design | record schema/service | polling/terminal-state UI only if asynchronous validation remains | compatibility tests | 63 |
| No refresh/re-sign contract exists for expired download URLs | Prefer re-fetching Record Detail to obtain new URLs; add a dedicated endpoint only if provider constraints prove it necessary | Record detail signer/cache policy | loaders retry via Record Detail, not stale URL | signed-expiry tests | 62/64 |
| Session cookie has no expiry/CSRF contract | Preserve cookie-auth semantics; define server-side expiry/revocation and architecture-appropriate CSRF protection | auth schemas/routes/session repository/security config | OAuth redirect/login UI and CSRF header only if selected design requires it | session migration and security tests | 61 |
| OAuth start/callback routes do not exist | Add minimal Google start and callback routes; production removes/404s mock-login | auth router/service/config | replace mock mutation with redirect/callback handling | auth integration tests | 61/64 |
| Record has no delete API despite artifact cleanup requirement | Decide whether deletion is required for current MVP acceptance; if yes, add one owned delete route with explicit object/DB cleanup policy | records route/service/repos/storage | optional Records action | FK/object cleanup tests | 58 blocker → 62/63 |
| No status refresh orchestration | Reuse Record Detail/list refetch first; add no WebSocket | no API change expected | bounded polling/refetch in Task 64 | lifecycle UI tests | 63/64 |

## 3. Ambiguities Locked for Later-task Resolution

- **Processing duration:** browser creates Pose and metrics. Task 63 must choose synchronous validation (`Uploading → Processing → Ready` within finalize) or observable short-lived Processing with bounded polling. It must not introduce a worker/queue.
- **Failure retry:** decide whether retry returns a Failed Record to `Uploading` or creates a new Record. No transition may be invented in the frontend.
- **Session storage:** PostgreSQL-backed opaque sessions are the default recommendation. Task 61 may propose another durable server-side store only with approval; stateless bearer auth is not an assumed redesign.
- **CSRF:** choose protection after OAuth/session cookie topology is fixed. SameSite alone must be justified; a decorative unused token is not acceptable.
- **Object deletion:** define ordering and compensation between object cleanup and DB deletion; avoid pretending cross-system atomicity.
- **Checksum:** select one supported browser/provider algorithm and define encoding, signed-header behavior, and mismatch response.
- **Canonical object path:** preserve type semantics but include an ownership-safe namespace if necessary; clients must use returned `storagePath` and never invent it.
- **Metric version naming:** current field is `metricDefinitionVersion`; Task 59 must confirm it represents calculation definition/version and avoid adding a duplicate concept unless required.

## 4. Current Contract Defects That Do Not Justify Redesign

- `database_url` is configuration without a runtime consumer; fix binding, not HTTP APIs.
- Repository classes are concrete in-memory stores rather than explicit protocols. Task 60 may introduce protocols/adapters while preserving service methods and routes.
- `SignedUrlService` returns syntactically plausible but fake URLs. Replace adapter behavior; retain response fields.
- Compare already obtains Record Detail and loads its artifact URLs. Replace loader fallback and storage source; no Compare-specific backend API is needed.
- Dashboard already groups Metric Summaries using `(metricId, unit, metricDefinitionVersion, activityType, side)`. Persist/query it efficiently rather than redefining analytics.

## 5. Unresolved Blockers Requiring Human Approval

1. Production object-store choice and cloud project/bucket/credential ownership (Task 62).
2. Approved Google OAuth origins, redirect URIs, consent-screen ownership, and secret delivery (Task 61).
3. Deployment public origins/domains that determine CORS and cookie policy (Task 61).
4. Whether Record deletion is required in Production MVP and its retention policy (Task 62/63).
5. Synchronous versus observable short-lived Processing and Failed retry semantics (Task 63).

These blockers do not prevent Tasks 59–60 from beginning after Task 58 review, but they must be resolved before their owning task is accepted.

## 6. Compatibility Rules

- Additive optional response fields precede frontend reliance on them.
- Database migrations preserve already-created development data where practical, but current in-memory runtime state has no durable migration source and is explicitly disposable.
- Frontend must tolerate a staged backend rollout only in non-production development; Production releases backend migration/contracts before dependent frontend code.
- No existing contract is modified by Task 58.
