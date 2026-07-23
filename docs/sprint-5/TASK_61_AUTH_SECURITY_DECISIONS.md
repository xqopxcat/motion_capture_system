# Task 61 — Authentication Security Decisions

## OAuth attempt

OAuth state is 256-bit URL-safe randomness. Only its SHA-256 hash is stored in PostgreSQL with the PKCE verifier, nonce, validated return path, expiry and consumption timestamp. Callback selection uses `FOR UPDATE`; consumption is single-use and committed even when provider exchange later fails safely. Attempts expire after ten minutes by default.

Process-global state and unsigned browser-only state were rejected because restart behavior and replay control would be weaker.

## OIDC and PKCE

Authorization Code flow uses PKCE S256 and an independent nonce. Although a confidential backend client already authenticates with a secret, PKCE adds code-interception defense without exposing the verifier. Google token exchange and token validation remain backend-only.

Accepted identity requires:

- issuer `https://accounts.google.com` or `accounts.google.com`;
- exact configured audience;
- future expiration;
- exact nonce;
- non-empty `sub`;
- verified email.

Google `sub`, never email alone, is the permanent provider identity.

## Sessions

Session tokens use `secrets.token_urlsafe(32)` with a non-secret prefix. PostgreSQL stores SHA-256 hashes, not raw tokens. Collision allocation retries three times inside savepoints. Expiry is fixed, multiple Sessions per User are allowed, logout revokes only the current Session, and no sliding expiry is used.

No session signing/encryption secret is required because the cookie contains only high-entropy opaque randomness and all authority is server-side.

## Cookies and deployment topology

The approved topology is same-site, potentially cross-origin frontend/API. Cookie defaults to `HttpOnly`, `SameSite=Lax`, path `/`; production and production-like require `Secure`. Domain is unset unless deployment needs a shared parent domain. Issuance and clearing use identical name, domain, path, Secure and SameSite settings.

`SameSite=None` is rejected unless Secure.

## CSRF and CORS

Authenticated `POST`, `PUT`, `PATCH` and `DELETE` require an exact allowlisted `Origin`. Combined with SameSite and explicit credentialed CORS, this is the MVP CSRF control; OAuth state is separate protection. Safe methods are unaffected. Test mode disables CSRF explicitly; production cannot.

Wildcard credentialed origins are rejected. Production frontend origin must exist in both auth/CORS and CSRF allowlists.

## Redirects

Return targets are normalized after repeated URL decoding. Only relative frontend paths or absolute URLs on the exact configured frontend origin are accepted. Protocol-relative paths, foreign origins, backslashes, control characters and encoded bypasses are rejected. `/dashboard` is the default.

## Dev/test isolation

Production and production-like require `AUTH_ADAPTER=google` and reject dev/test auth and `DEV_AUTH_ENABLED`. Local dev auth requires all of: `APP_ENV=local`, `AUTH_ADAPTER=dev`, explicit opt-in and an exact configured localhost Origin. Tests explicitly select `AUTH_ADAPTER=test`; Google network calls are replaced at the provider boundary.

## Logging and threat review

Logs contain failure categories only. Raw cookies, Session tokens/hashes, OAuth codes, ID/access tokens, client secrets and full email addresses are not logged.

Focused review mitigations:

- state fixation/replay: random hashed state, expiry, row lock, single consumption;
- nonce/code interception: nonce plus PKCE;
- session fixation/predictability: new high-entropy token after login;
- identity collision: unique provider/subject and race recovery;
- open redirect: normalized exact allowlist;
- CSRF/CORS: SameSite, Origin enforcement and explicit credentialed origins;
- dev exposure/config fallback: fail-fast environment validation and runtime 404;
- error leakage: controlled callback redirect and generic public errors.

This is a focused self-review, not a penetration test.

