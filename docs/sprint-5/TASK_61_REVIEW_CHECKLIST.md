# Task 61 Review Checklist

## OAuth and identity

- [x] Google start/callback routes exist.
- [x] State is random, hashed at rest, expiring, row-locked and single-use.
- [x] Nonce and PKCE S256 are implemented.
- [x] Issuer, audience, expiration, nonce, subject and verified email are validated.
- [x] Google `sub` is the durable identity; email changes update profile without changing User ID.
- [x] Duplicate provider identity is database-constrained and race recovery exists.
- [x] Redirect normalization and exact frontend allowlisting prevent open redirects.

## Sessions and APIs

- [x] Opaque cryptographically random Session tokens are hash-only in PostgreSQL.
- [x] Token collision retry, fixed expiry and revocation are implemented.
- [x] Multiple Sessions per User are allowed; no sliding expiry.
- [x] Logout revokes server state, clears the matching cookie and is idempotent.
- [x] `/api/me` and protected APIs use durable Session/User repositories.
- [x] Missing, malformed, unknown, expired, revoked and orphaned Sessions disclose no internal distinction.
- [x] Application/session recreation persistence is covered.

## Browser security

- [x] Production cookie is Secure and HttpOnly with explicit SameSite/path/domain policy.
- [x] Authenticated mutations enforce exact Origin allowlist.
- [x] Credentialed CORS is explicit and rejects wildcard configuration.
- [x] RTK Query centralizes `credentials: include`.
- [x] Frontend stores no Google or Session token in localStorage/sessionStorage.
- [x] Raw OAuth/session secrets are not logged.

## Isolation and configuration

- [x] Production and production-like require Google and reject dev/test auth.
- [x] Local dev auth is disabled by default, localhost-only and explicit.
- [x] Automated tests inject a deterministic provider and make no Google request.
- [x] Production missing/unsafe authentication configuration fails fast.
- [x] `.env.example`, configuration guide and runbook contain placeholders only.

## Migration and validation

- [x] Narrow migration `20260724_0002` adds only durable OAuth attempts.
- [x] Upgrade applied to the local PostgreSQL database and schema is at head.
- [x] Backend unit/API plus PostgreSQL integration suite passes.
- [x] Frontend authentication suite and TypeScript/Vite build pass.
- [x] Live Google OAuth start, account consent, callback, `/dashboard`, durable User/Session and logout were validated locally on 2026-07-24.
- [x] The setup-time Client Secret was rotated; the replacement was revalidated through a second live login and the original secret was disabled and deleted.
- [ ] Before Task 65 release validation, add and validate the guarded authentication cleanup CLI and deployment scheduler described in the runbook.

## Scope

- [x] Existing `/api/me` and `/api/auth/logout` contracts are preserved.
- [x] Minimal frontend change is limited to authentication.
- [x] No GCS implementation.
- [x] No Record lifecycle redesign.
- [x] No Capture production upload wiring.
- [x] No worker, queue, Redis or bearer-token architecture.
