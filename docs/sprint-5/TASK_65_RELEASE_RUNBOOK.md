# Task 65 — Production MVP Release Runbook

## Release configuration checklist

- `APP_ENV=production`
- `DATABASE_URL` targets the intended PostgreSQL database using the restricted
  application role
- `MIGRATION_POLICY=require_head`
- `REPOSITORY_ADAPTER=postgresql`
- `AUTH_ADAPTER=google`
- `DEV_AUTH_ENABLED=false`
- production Google client ID, secret, callback URI, and callback allowlist
- exact frontend, authentication, CSRF, and CORS origin allowlists
- `SESSION_COOKIE_SECURE=true`
- `SESSION_COOKIE_HTTP_ONLY=true`
- SameSite matches the actual frontend/backend deployment topology
- `STORAGE_ADAPTER=gcs`
- production GCS project and private bucket
- workload identity or another deployment-native credential mechanism; no
  committed JSON service-account key
- upload/download TTLs and object-size limits reviewed
- no runtime/demo/production seed or mock adapter
- startup fails before serving traffic when any required setting is invalid

Never print environment values containing passwords, OAuth secrets, raw
sessions, Google tokens, signed URLs, or storage credentials.

## Migration and startup

From the backend release directory:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m scripts.check_database
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Production uses its deployment platform's service/process manager, health
checks, secret injection, and restart policy. Do not use `--reload`.

Rollback normally deploys the previous application version and applies a
forward corrective migration. Never run a destructive Alembic downgrade
against production data without a separately approved recovery plan and a
verified backup.

## PostgreSQL backup/restore smoke

Create a custom-format dump:

```powershell
pg_dump -h <host> -U <application-or-backup-role> -d <database> `
  -Fc -f motion_capture.dump
pg_restore --list motion_capture.dump
```

An administrator creates a clean restore target. Restore without replaying
source ownership or grants:

```powershell
pg_restore -h <host> -U <restore-role> `
  -d <clean_restore_database> `
  --no-owner --no-privileges --exit-on-error `
  motion_capture.dump
```

Confirm Alembic revision, core row counts, Record ownership, and zero orphaned
Artifact, Metric Summary, and Annotation relationships. Delete the temporary
restore database and dump according to the approved retention policy after
validation.

This smoke test does not provide scheduled backups, PITR, multi-region
replication, or a disaster-recovery platform.

## Authentication cleanup

Dry-run first, then execute the bounded batch:

```powershell
.\.venv\Scripts\python.exe -m scripts.cleanup_auth_data `
  --confirm-app-env production `
  --batch-size 500

.\.venv\Scripts\python.exe -m scripts.cleanup_auth_data `
  --confirm-app-env production `
  --batch-size 500 `
  --execute
```

Configure the selected deployment platform's native scheduler to run this
daily. The exact environment confirmation must match `APP_ENV`; active,
unexpired sessions are never eligible. Do not run cleanup during application
startup.

## Release evidence and stop conditions

Do not approve release when any of these remain:

- schema is not at Alembic head
- backend or frontend build/test gate fails
- mock/dev authentication can be enabled in production
- GCS objects are public or runtime falls back to fake storage
- live OAuth, Capture/upload/finalize, Viewer, Annotation, Compare, Dashboard,
  restart persistence, second-user isolation, deletion, URL expiry, or
  backup/restore smoke is unverified
- required deployment scheduler or secret/origin/cookie configuration is
  unknown
