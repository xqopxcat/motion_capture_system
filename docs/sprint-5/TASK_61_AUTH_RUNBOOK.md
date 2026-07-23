# Task 61 — Authentication Runbook

## Google setup

1. In Google Cloud Console configure the OAuth consent screen.
2. Create an OAuth 2.0 Web application client.
3. Add the exact backend callback, for example `https://api.example.com/api/auth/google/callback`, under authorized redirect URIs.
4. JavaScript origins are not required for this backend-owned flow; if configured operationally, use only the exact frontend origin.
5. Supply client ID/secret through the environment/secret manager and add the callback to `GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS`.
6. Apply `python -m alembic upgrade head` before application startup.

## Local validation

1. Configure PostgreSQL and apply migrations.
2. For real Google local flow, use `AUTH_ADAPTER=google`, the exact local callback and Google credentials.
3. For isolated dev identity, set `APP_ENV=local`, `AUTH_ADAPTER=dev`, `DEV_AUTH_ENABLED=true`, and localhost-only dev/auth/CSRF origins.
4. Start backend and frontend.
5. Open `/login`, sign in, then verify `GET /api/me` returns the internal User.
6. Call `POST /api/auth/logout` from the frontend origin and verify `/api/me` returns 401.

## Start the local backend as a hidden background process

Run the following from the repository root:

```powershell
$backend = Start-Process `
  -FilePath "$PWD\backend\.venv\Scripts\python.exe" `
  -ArgumentList @(
    "-m", "uvicorn",
    "app.main:app",
    "--host", "127.0.0.1",
    "--port", "8000"
  ) `
  -WorkingDirectory "$PWD\backend" `
  -WindowStyle Hidden `
  -PassThru

$backend.Id
```

The returned value is the backend process ID. This mode has no visible terminal log and does not reload automatically after source changes.

Verify startup:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Expected response:

```text
status
------
ok
```

Find the process later if the original PowerShell variable is no longer available:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8000 |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Stop the exact process stored at startup:

```powershell
Stop-Process -Id $backend.Id
```

Or resolve the listener before stopping it:

```powershell
$backendPid = (
  Get-NetTCPConnection -State Listen -LocalPort 8000
).OwningProcess

Get-Process -Id $backendPid
Stop-Process -Id $backendPid
```

Always inspect the resolved process before stopping it. Do not start a second backend while port `8000` is already listening.

For normal backend development, prefer a visible terminal with reload and logs:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app `
  --reload `
  --host 0.0.0.0 `
  --port 8000
```

Recommended usage:

- active backend development: visible terminal with `--reload`;
- frontend or live OAuth integration testing: hidden background process without `--reload`;
- staging and production: deployment-platform service management, never Uvicorn `--reload`.

## Authentication-data cleanup

The cleanup implementation is a prerequisite for Task 65 production release validation, not a reason to introduce a worker or queue in Task 61.

Before Task 65:

1. add an environment-guarded authentication maintenance CLI;
2. delete consumed or expired OAuth login attempts older than the approved short retention window;
3. delete expired or revoked Sessions only after the approved audit-retention window;
4. preserve active Sessions;
5. support dry-run/count output and bounded batches;
6. add PostgreSQL integration tests proving active Sessions are retained;
7. document the exact production command.

After the deployment platform is selected, configure its native scheduler to run the CLI daily. Task 65 must validate one manual production-like execution and confirm that the scheduler configuration cannot run against an unintended database.

Recommended initial retention policy:

- consumed/expired `oauth_login_attempts`: delete after 24 hours;
- expired/revoked `auth_sessions`: delete after 30 days;
- active, unexpired Sessions: never delete.

These values are operational defaults and should remain configurable. Do not run cleanup automatically during application startup.

## Production-like/production validation

1. Inject production settings without printing secrets.
2. Confirm migration head `20260724_0002`.
3. Confirm HTTPS and Secure cookie behavior in browser developer tools.
4. Confirm an allowlisted frontend mutation succeeds and a foreign/missing Origin returns 403.
5. Confirm `/auth/mock-login` returns 404.
6. Complete Google login, restart the backend, resend the same cookie and verify `/api/me`.

## Operations

- Rotate Google secret: create/activate the replacement in Google, update secret manager and restart instances; never log either secret.
- Revoke all Sessions for a User with an audited database maintenance command setting `revoked_at`; normal logout revokes only the current Session.
- Remove expired Sessions and consumed/expired OAuth attempts with an explicit guarded maintenance command/repository operation.
- Disable dev auth by setting `DEV_AUTH_ENABLED=false` and `AUTH_ADAPTER=google`, then restart.

## Troubleshooting

- `redirect_uri_mismatch`: compare scheme, host, port and path byte-for-byte across Google Console, `GOOGLE_OAUTH_REDIRECT_URI`, and the allowlist.
- Cookie missing: verify HTTPS, Secure, SameSite, domain/path, frontend credentials mode and exact API origin.
- CORS failure: ensure frontend origin is exactly in `AUTH_ALLOWED_ORIGINS`; do not use `*`.
- CSRF 403: mutation must carry browser `Origin` exactly listed in `CSRF_ALLOWED_ORIGINS`.
- callback returns login error: state may be expired/reused, provider exchange may have failed, or identity claims may not match. Logs expose category only.
- startup rejection is intentional: correct the reported unsafe combination; never switch to mock fallback.

Run automated validation:

```powershell
$env:RUN_POSTGRES_REPOSITORY_TESTS='1'
.\.venv\Scripts\python.exe -m pytest app\tests -q
.\.venv\Scripts\python.exe -m alembic current
```
