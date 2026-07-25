# Task 63 — Processing & Record Lifecycle

Status: **Accepted**

## Processing boundary

Pose inference and metric calculation remain browser-owned. The backend does not
run an analysis engine, worker, queue, scheduler, or WebSocket workflow.
`Processing` means synchronous server validation/finalization of browser-produced
artifacts and Metric Summary metadata.

## State machine

```text
create
  |
  v
Uploading --finalize with all required data--> Processing --> Ready
   |                                             |
   | missing data: remain Uploading              +--> Failed
   |                                                   |
   +<---------------- explicit retry ------------------+
```

Legal transitions are create to `Uploading`, `Uploading` to `Processing`,
`Processing` to `Ready` or `Failed`, and retryable `Failed` to `Uploading`.
`Ready` finalize is idempotent. A duplicate concurrent finalize can observe
`Processing`, `Ready`, or `Failed`; it cannot restart or overwrite the state.

## Finalization validation

Before `Processing`, the backend requires completed and integrity-verified Video,
Pose, Metric Series, Thumbnail, and a non-empty Metric Summary. Missing data
returns `RECORD_FINALIZATION_INCOMPLETE` and leaves the Record `Uploading`.

During finalization, every production Metric Summary item requires metric ID,
unit, metric definition/calculation version, activity type, and side.
Compatibility failure persists `Failed` with stage, code, safe message,
timestamp, and `retryable=true`.

All PostgreSQL lifecycle changes in one HTTP request share the request
transaction. An exception rolls them back; a returned Failed result commits its
failure metadata.

## Timeout and retry

`RECORD_PROCESSING_TIMEOUT_SECONDS` defaults to 30 seconds. Because processing
is synchronous, a stale `Processing` row represents an interrupted request or
process. The next finalize persists `PROCESSING_TIMEOUT` at stage
`finalization`, marked retryable.

`POST /api/records/{id}/retry` is the only retry transition. It clears failure
metadata, increments `retryCount`, and returns the Record to `Uploading`.
Non-retryable failures return `RECORD_NOT_RETRYABLE`.

## Additive API fields

Finalize may return `Processing`, `Ready`, or `Failed`, with optional
`failureCode`, `failureMessage`, and `retryable`. Record detail adds lifecycle
timestamps, failure metadata, `updatedAt`, and `retryCount`. Record list adds
safe failure information and `updatedAt`.

No signed URL or raw provider error is persisted in failure metadata.

## Record deletion policy

`DELETE /api/records/{id}` is owner-scoped and uses non-disclosing 404 behavior.
The operation is ordered:

1. Load the owned Record and exact persisted artifact paths.
2. Validate production paths remain under the owner/Record canonical prefix.
3. Delete GCS objects using their recorded generation.
4. Treat already-missing objects as successful retry progress.
5. Delete PostgreSQL only after all object cleanup succeeds.
6. PostgreSQL cascades Artifacts, Metric Summary/items, and Annotations.

GCS and PostgreSQL cannot share a transaction. If GCS cleanup fails, the Record
is retained and persisted as retryable `Failed` at stage `deletion`; the API
returns `502 CleanupFailed` with completed object count. Repeating DELETE is
safe: missing objects are accepted, remaining objects are retried, and the
database row is removed only when cleanup finishes.

Cross-user DELETE returns 404 and never exposes another user's object paths.

## Database impact

No Task 63 migration is required. Task 59 already created status, failure,
retry, and lifecycle timestamp columns and constraints. Task 63 activates those
fields through repository transitions using PostgreSQL row locks.

## Verification

- Backend: 108 passed; 7 PostgreSQL-gated tests skip without an isolated
  `TEST_DATABASE_URL`.
- Focused tests cover compatibility failure/retry, timeout, partial cleanup,
  idempotent finalize, invalid retry, owned deletion, and cross-user denial.
- Frontend production build passes with additive types and endpoints. Task 64
  owns UI orchestration, polling, and destructive confirmation UX.

