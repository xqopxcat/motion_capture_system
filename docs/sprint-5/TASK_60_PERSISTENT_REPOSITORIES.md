# Task 60 — Persistent Repositories

## Outcome

Normal application runtime now uses PostgreSQL repositories. Repository contracts remain independent of SQLAlchemy, request handlers receive services through FastAPI dependencies, and in-memory implementations are only installed explicitly by unit tests.

Implemented PostgreSQL adapters:

- User
- Auth Session
- Record
- Artifact
- Metric Summary and Metric Summary Item
- Annotation
- Dashboard aggregation

## Persistence and ownership rules

- Records survive application/session recreation because PostgreSQL is the source of truth.
- Raw session tokens are returned to the client once and only SHA-256 token hashes are stored.
- Record, Artifact, Metric Summary and Annotation owner-sensitive reads include the Record owner predicate in SQL.
- Dashboard queries are filtered by `records.owner_user_id` in the database.
- Record deletion is present as `delete_owned(record_id, owner_user_id)` and relies on the Task 59 database cascade for Record children.
- User deletion remains restricted by the Task 59 foreign-key policy.

The public Record deletion API, GCS object cleanup, retry behavior and the exact database/object-store ordering are not claimed complete here. Those must be completed with Tasks 62 and 63 before Production MVP deletion is accepted end to end.

## Query behavior

Record List performs one owned-Record query and one batch Thumbnail query. It does not issue one Thumbnail query per Record.

Dashboard snapshot performs four bounded database queries:

1. conditional aggregate counts for total, Ready, Failed and recent Records;
2. count of Ready Records with a Metric Summary;
3. count of Ready Records with at least one compatible Metric Summary item;
4. ordered compatible trend rows.

Metric Summary item loading is still repository-level and appropriate for the current single-Record detail/finalization paths. Any future bulk-summary consumer must use a joined/batched query rather than repeatedly calling the single-summary method.

## Compatibility boundary

API schemas and service behavior were kept stable. This task does not add Google OAuth, GCS signing/storage, a worker/queue, browser analysis changes, lifecycle redesign or frontend production wiring.

The current upload-completion API does not yet provide authoritative byte size, content type or checksum. The PostgreSQL Artifact adapter therefore preserves the existing contract with temporary legacy metadata. Task 62 must replace that compatibility bridge with verified GCS object metadata; it is not production artifact validation.

## Verification

The repository integration suite uses the configured PostgreSQL database with an outer transaction that is rolled back after every test. It refuses production and production-like environments. It covers:

- application-session recreation persistence;
- cross-user filtering;
- Dashboard ownership and compatibility;
- transaction rollback;
- Record child cascade;
- Artifact uniqueness/upsert behavior;
- Annotation ownership.

