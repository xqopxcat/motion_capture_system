# Task 62 — Production Artifact Storage

Status: backend implementation complete; live GCS resource validation pending.

## Locked decisions

- Production storage is Google Cloud Storage only.
- The bucket is private, uses uniform bucket-level access, and must have Public Access Prevention enforced.
- Local normal runtime uses a dedicated private development bucket. There is no silent fallback.
- `fake` storage is permitted only with `APP_ENV=test`.
- Canonical paths are owner-scoped:
  `users/{userId}/records/{recordId}/{artifact-family}/{canonical-file}`.
- Supported artifact types are Video, Pose, Metric Series, and Thumbnail.
- SHA-256 is calculated by the client and signed as `x-goog-meta-sha256`.
- Signed PUT binds Content-Type and uses `ifGenerationMatch=0`; replacement is not allowed.
- Completion reads GCS metadata and verifies path, Content-Type, size, SHA-256 metadata, and generation before marking the database row `Complete` / `Verified`.
- Identical completion retries are idempotent. Conflicting retries return `409`.
- Record-object and partial-upload deletion are exact-path primitives. Scheduling and lifecycle orchestration remain outside Task 62.

## Runtime variables

See `backend/.env.example`. Required for GCS:

- `STORAGE_ADAPTER=gcs`
- `GCS_PROJECT_ID`
- `GCS_BUCKET_NAME`
- Application Default Credentials or a workload identity able to sign V4 URLs and read/delete objects.

Never commit service-account JSON. Prefer workload identity in deployed environments.

## Private dev bucket checklist

1. Create a globally unique bucket in the chosen region.
2. Enable uniform bucket-level access.
3. Enforce Public Access Prevention.
4. Grant the runtime identity only the object permissions it needs.
5. Configure bucket CORS for the exact frontend origin and methods `PUT`, `GET`, `HEAD`; allow request headers `Content-Type` and `x-goog-meta-sha256`.
6. Verify anonymous object GET returns denied.
7. Run signed PUT, metadata validation, signed GET, expiry, generation-conflict, and delete smoke tests.

## API contract additions

Upload URL requests include `fileSize`, `checksumAlgorithm: "sha256"`, and a lowercase 64-character hex `checksum`.
Completion requests repeat those fields and may include `objectGeneration`.

Legacy zero-checksum defaults and legacy paths exist only in explicitly injected test runtime to keep old unit fixtures isolated. They are not reachable in local, production-like, or production runtime.

## Live validation record

Not yet approved as passed. The Google Cloud Console page timed out during automation on 2026-07-24; no bucket or IAM resource was created. Complete the private dev bucket checklist before marking Task 62 accepted.
