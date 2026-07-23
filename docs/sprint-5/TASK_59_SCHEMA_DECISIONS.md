# Task 59 Schema Decisions

## Relationship diagram

```text
users
├── auth_sessions                 ON DELETE CASCADE
└── records                       ON DELETE RESTRICT from user
    ├── artifacts                 ON DELETE CASCADE
    ├── metric_summaries          ON DELETE CASCADE, one per Record
    │   └── metric_summary_items  ON DELETE CASCADE
    └── annotations               ON DELETE CASCADE
         └── author user          ON DELETE RESTRICT
```

## Tables and significant fields

| Table | Purpose and significant fields |
| --- | --- |
| `users` | String application ID, identity provider + provider subject, email, display name, avatar URL, timestamps |
| `auth_sessions` | String ID, unique token hash, user FK, expiry, revocation, last-used and audit timestamps; no OAuth tokens |
| `records` | Aggregate root, owner, metadata, JSONB tags, canonical status, capture measurements, lifecycle/failure/retry fields, timestamps |
| `artifacts` | One of each Video/Pose/Metrics/Thumbnail per Record; canonical path, content/version, expected/validated size, checksum and integrity/upload state, GCS generation placeholder, completion/audit timestamps |
| `metric_summaries` | One structured summary container per Record |
| `metric_summary_items` | Compatibility dimensions plus min/max/average/range-of-motion and optional standard deviation |
| `annotations` | Record and author FKs, immutable frame/joint binding fields, timestamp, title/note and audit timestamps |

## IDs and time

Public IDs remain bounded strings compatible with current `user_*`, `record_*`, `annotation_*` contracts. No sequential identifier leaks into APIs. New Artifact/Summary/Item/Session IDs use the same application-generated string approach. All timestamp columns are timezone-aware; database `now()` supplies creation/update defaults. Task 60 must generate UTC application timestamps where business events require explicit values.

## Status and check constraints

- Record status is limited to `Uploading`, `Processing`, `Ready`, `Failed`.
- Artifact type is limited to `video`, `pose`, `metrics`, `thumbnail`.
- Artifact upload state is `Pending`, `Complete`, or `Failed`; integrity is `Pending`, `Verified`, or `Failed`.
- Duration/FPS/file sizes are positive when present; frame/retry/annotation indexes are non-negative.
- Expected checksum algorithm/value must both be null or both be present; a validated checksum requires an algorithm.
- Metric maximum must be at least minimum; range of motion and standard deviation are non-negative.
- Failure detail is permitted only on a Failed Record. More complete status/timestamp invariants are deferred to Task 63.

## Uniqueness

- User `(identity_provider, provider_subject)` is the stable OAuth identity key; email is indexed but not identity.
- Session `token_hash` is unique.
- Artifact `(record_id, artifact_type)` and `storage_path` are unique.
- One Metric Summary per Record.
- Metric item `(summary_id, metric_id, unit, metric_definition_version, activity_type, side)` is unique using PostgreSQL `NULLS NOT DISTINCT`.

## Indexes

- Records: `(owner_user_id, created_at)`, `(owner_user_id, status, created_at)`, `(owner_user_id, captured_at)`.
- Sessions: user, expiry, and `(user_id, expires_at, revoked_at)` active-session lookup.
- Artifacts: `(record_id, upload_state)`.
- Metric items: metric ID, `(activity_type, side)`, full compatibility key.
- Annotations: `(record_id, frame_index, created_at)` and `(author_user_id, record_id)`.
- User email is indexed for lookup but intentionally not unique.

Owner-scoped Dashboard trend queries join Records through owner/status/created indexes to the one-per-Record summary and indexed compatibility dimensions. SQL aggregation belongs to Task 60.

## Record deletion policy

Deleting a Record cascades its Artifact metadata, Metric Summary/items, and Annotations, preventing PostgreSQL orphans. Embedded JSONB tags disappear with the Record. Deleting a User is restricted while Records or authored annotations remain; sessions cascade because they have no independent retention value.

This cascade describes only PostgreSQL metadata. It does not claim atomic GCS cleanup. Task 62 deletes objects; Task 63 defines ordering, idempotency, retry and compensation before the final Record deletion commits.

## Tag persistence

Tags remain an ordered JSONB array on `records`. This exactly preserves the active API's `list[str]`, needs no new Tag repository/API, and avoids inventing tag-management behavior. A normalized tag model can be reconsidered only if approved server-side tag search/filter requirements outgrow JSONB indexing.

## Metric Summary compatibility

The existing key `(metricId, unit, metricDefinitionVersion, activityType, side)` maps directly to item columns. `metricDefinitionVersion` remains the calculation-definition version; no duplicate `metricVersion` was added. Nullable dimensions preserve existing upload contracts, but Dashboard-compatible trends still require all dimensions at service/query level.

## Deferred integrity rules

- Task 62 selects checksum algorithms, accepted MIME types/sizes, GCS generation semantics, and verifies objects.
- Task 63 owns legal lifecycle timestamp combinations, transition ordering, retries, and deletion workflow state.
- Task 60 owns SQL transaction boundaries and owner-scoped access, not the schema mapping itself.
