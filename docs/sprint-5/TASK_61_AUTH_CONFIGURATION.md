# Task 61 — Authentication Configuration

## Variables

| Variable | Purpose |
|---|---|
| `AUTH_ADAPTER` | `google`, `dev`, or test-only `test` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | confidential Google OAuth client |
| `GOOGLE_OAUTH_REDIRECT_URI` | backend callback URL |
| `GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS` | exact callback allowlist |
| `FRONTEND_ORIGIN` | canonical frontend origin |
| `AUTH_ALLOWED_ORIGINS` | credentialed CORS allowlist |
| `SESSION_COOKIE_*` | cookie name, Secure, HttpOnly, SameSite, domain and path |
| `SESSION_LIFETIME_SECONDS` | fixed absolute lifetime |
| `OAUTH_ATTEMPT_LIFETIME_SECONDS` | state/PKCE/nonce lifetime |
| `DEV_AUTH_ENABLED` / `DEV_AUTH_ALLOWED_ORIGINS` | guarded localhost dev provider |
| `CSRF_MODE` / `CSRF_ALLOWED_ORIGINS` | Origin-based mutation protection |

`CORS_ORIGINS` is legacy configuration; authentication CORS is sourced from `AUTH_ALLOWED_ORIGINS`.

## Environment matrix

| Environment | Auth adapter | Cookie | CSRF | Dev auth |
|---|---|---|---|---|
| test | explicit `test` or injected fake Google provider | test policy | explicitly disabled/adapted | deterministic only |
| local Google | `google` | Secure false permitted on localhost HTTP | Origin | off |
| local dev identity | `dev` | Secure false on localhost HTTP | Origin | explicit opt-in and localhost Origin |
| production-like | `google` only | Secure + HttpOnly | Origin required | forbidden |
| production | `google` only | Secure + HttpOnly | Origin required | forbidden |

## Placeholder production example

```dotenv
APP_ENV=production
AUTH_ADAPTER=google
GOOGLE_CLIENT_ID=replace-me.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=replace-through-secret-manager
GOOGLE_OAUTH_REDIRECT_URI=https://api.example.com/api/auth/google/callback
GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS=["https://api.example.com/api/auth/google/callback"]
FRONTEND_ORIGIN=https://app.example.com
AUTH_ALLOWED_ORIGINS=["https://app.example.com"]
SESSION_COOKIE_NAME=mocap_session
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_SAME_SITE=lax
SESSION_COOKIE_PATH=/
SESSION_LIFETIME_SECONDS=86400
OAUTH_ATTEMPT_LIFETIME_SECONDS=600
DEV_AUTH_ENABLED=false
CSRF_MODE=origin
CSRF_ALLOWED_ORIGINS=["https://app.example.com"]
```

Production startup rejects missing credentials/callback/frontend origin, unallowlisted callback, dev/test adapter, dev auth, insecure cookie, disabled CSRF, wildcard origin, contradictory SameSite/Secure, and frontend origins absent from auth/CSRF allowlists. Secrets must come from environment or the deployment secret manager and must never be committed.

Frontend local development may set `VITE_API_BASE_URL=http://localhost:8000/api`. Set `VITE_DEV_AUTH_ENABLED=true` only when the backend local dev adapter is deliberately enabled.

