# Task 61 — Production Authentication

## Objective and architecture

Task 61 replaces the production mock-login path with:

```text
Browser → Google Authorization Code/OIDC → Backend callback
        → durable User mapping → opaque PostgreSQL Session
        → HttpOnly cookie → authenticated API
```

The backend owns OAuth initiation, callback, code exchange, identity validation, User mapping, Session creation/revocation, cookie issuance and current-user resolution. Google/session tokens are never exposed to frontend JavaScript or browser storage.

## Implemented flow

- `GET /api/auth/google/start` validates `returnTo`, creates a PostgreSQL OAuth attempt and redirects to Google.
- The request uses state, nonce and PKCE S256 with only `openid email profile`.
- `GET /api/auth/google/callback` consumes state once, exchanges the code, validates Google identity, maps `google + sub`, creates an opaque Session and redirects to the approved frontend.
- `GET /api/me` resolves the hashed durable Session and User.
- `POST /api/auth/logout` revokes the server Session and clears the matching cookie; it is idempotent.
- Authenticated mutation requests require an allowlisted Origin.
- Credentialed CORS uses an explicit authentication origin allowlist.

Existing Google identities retain their internal User ID even if profile/email changes. First login creates only the necessary provider subject, email, display name and optional avatar URL.

## Backend and frontend changes

Backend adds the auth provider/policy package, OAuth service/repository contract, PostgreSQL OAuth attempt adapter, secure route behavior, CSRF middleware, configuration validation and migration `20260724_0002`.

Frontend Login now navigates directly to the backend Google start route. RTK Query already sends `credentials: include`; logout and `/me` remain unchanged. A local-development login button exists only when Vite development mode and `VITE_DEV_AUTH_ENABLED=true` are both true.

## Lifecycle

- fixed absolute Session lifetime: default 24 hours;
- multiple device Sessions allowed;
- each Session independently revocable;
- expired/revoked/missing Sessions are uniformly unauthenticated;
- `last_used_at` is updated at most once per five minutes;
- expired Session/OAuth-attempt cleanup is explicit/opportunistic, not Redis-backed.

## Boundaries and limitations

- Google `tokeninfo` is used after token exchange to obtain Google-validated ID-token claims; the backend additionally checks issuer, audience, expiration, nonce, subject and verified email.
- Live Google OAuth was validated locally on 2026-07-24 with an operator-owned Google Cloud Web client, the exact localhost callback, a consent-screen test user, real Google code exchange and a durable application Session.
- Task 62 owns GCS and artifact validation.
- Task 63 owns Record lifecycle/finalization semantics.
- Task 64 owns the complete frontend production integration.
- Task 65 owns production-like end-to-end and broader restart validation.

No GCS, Capture upload, worker/queue or Record lifecycle redesign is included.

## Completion evidence

Backend unit/API and live PostgreSQL integration tests cover state expiry/replay, PKCE parameters, identity claims, provider-subject mapping, session hashing/expiry/revocation, cookies, logout, redirects, CSRF, CORS/config rejection and app/session recreation. Frontend authentication tests and TypeScript/Vite production bundle validation pass. Live Google validation reached `/dashboard`, persisted one stable Google User, consumed the OAuth attempt, created a server Session, and verified logout revocation. The Client Secret was rotated after setup and the original secret was disabled and deleted.
