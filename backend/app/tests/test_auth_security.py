from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.deps import get_google_identity_provider, get_repository_bundle
from app.auth.errors import InvalidIdentityError, InvalidOAuthStateError, InvalidRedirectError
from app.auth.google_provider import GoogleIdentity, GoogleIdentityProvider
from app.auth.redirects import validated_return_path
from app.core.config import Settings, settings
from app.main import app, create_app
from app.repositories.oauth_attempt_repository import OAuthAttemptRepository
from app.repositories.runtime_repositories import create_in_memory_repository_bundle
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.services.oauth_service import OAuthService


class FakeGoogleProvider:
    def __init__(self, identity: GoogleIdentity | None = None) -> None:
        self.identity = identity or GoogleIdentity("google-subject", "person@example.test", "Person", None)
        self.calls: list[tuple[str, str, str]] = []

    def exchange(self, *, code: str, code_verifier: str, expected_nonce: str) -> GoogleIdentity:
        self.calls.append((code, code_verifier, expected_nonce))
        return self.identity


def test_oauth_start_uses_state_nonce_pkce_and_minimum_scopes() -> None:
    attempts = OAuthAttemptRepository()
    provider = FakeGoogleProvider()
    service = OAuthService(
        attempts,
        UserRepository(),
        SessionRepository(),
        provider,
        client_id="client-id",
        redirect_uri="https://api.example.test/api/auth/google/callback",
    )
    result = service.start("/dashboard")
    query = parse_qs(urlparse(result.authorization_url).query)
    assert query["scope"] == ["openid email profile"]
    assert query["code_challenge_method"] == ["S256"]
    assert len(query["state"][0]) >= 40
    assert len(query["nonce"][0]) >= 40
    assert attempts.consume(query["state"][0]) is not None
    assert attempts.consume(query["state"][0]) is None


def test_expired_oauth_state_is_rejected() -> None:
    attempts = OAuthAttemptRepository(lifetime=timedelta(seconds=1))
    state, attempt = attempts.create(code_verifier="verifier", nonce="nonce", return_path="/dashboard")
    assert attempts.consume(state, now=attempt.expires_at) is None


def test_oauth_completion_maps_subject_stably_and_creates_opaque_session() -> None:
    attempts = OAuthAttemptRepository()
    users = UserRepository()
    sessions = SessionRepository()
    provider = FakeGoogleProvider()
    service = OAuthService(attempts, users, sessions, provider, client_id="client", redirect_uri="https://callback")
    first_state = parse_qs(urlparse(service.start("/records").authorization_url).query)["state"][0]
    first = service.complete(state=first_state, code="first-code")
    first_user = sessions.get_active(first.session_token)
    second_state = parse_qs(urlparse(service.start("/dashboard").authorization_url).query)["state"][0]
    second = service.complete(state=second_state, code="second-code")
    second_user = sessions.get_active(second.session_token)
    assert first_user is not None and second_user is not None
    assert first_user.user_id == second_user.user_id
    assert first.session_token.startswith("session_")
    with pytest.raises(InvalidOAuthStateError):
        service.complete(state=first_state, code="replay")


def test_fixed_session_expiry_and_revocation_are_enforced() -> None:
    sessions = SessionRepository()
    created = sessions.create_for_user("user")
    assert sessions.get_active(created.session_id) is not None
    assert sessions.revoke(created.session_id)
    assert sessions.get_active(created.session_id) is None
    expiring = SessionRepository(lifetime=timedelta(seconds=1))
    short = expiring.create_for_user("user")
    assert short.expires_at is not None
    assert expiring.get_active(short.session_id, now=short.expires_at) is None


@pytest.mark.parametrize(
    ("claims", "message"),
    [
        ({"iss": "evil", "aud": "client", "exp": "9999999999", "nonce": "n", "sub": "s", "email": "a@b", "email_verified": "true"}, "issuer"),
        ({"iss": "https://accounts.google.com", "aud": "wrong", "exp": "9999999999", "nonce": "n", "sub": "s", "email": "a@b", "email_verified": "true"}, "audience"),
        ({"iss": "https://accounts.google.com", "aud": "client", "exp": "1", "nonce": "n", "sub": "s", "email": "a@b", "email_verified": "true"}, "expired"),
        ({"iss": "https://accounts.google.com", "aud": "client", "exp": "9999999999", "nonce": "wrong", "sub": "s", "email": "a@b", "email_verified": "true"}, "nonce"),
    ],
)
def test_google_claim_validation_rejects_invalid_identity(claims: dict[str, object], message: str) -> None:
    provider = GoogleIdentityProvider(client_id="client", client_secret="secret", redirect_uri="https://callback")
    with pytest.raises(InvalidIdentityError, match=message):
        provider._validate_claims(claims, "n")


@pytest.mark.parametrize("unsafe", ["//evil.test", "https://evil.test/x", "%2F%2Fevil.test", "\\evil"])
def test_redirect_allowlist_rejects_open_redirects(unsafe: str) -> None:
    with pytest.raises(InvalidRedirectError):
        validated_return_path(unsafe, frontend_origin="https://app.example.test")


def test_oauth_routes_complete_without_google_network(monkeypatch: pytest.MonkeyPatch) -> None:
    bundle = create_in_memory_repository_bundle()
    fake = FakeGoogleProvider()
    monkeypatch.setattr(settings, "auth_adapter", "google")
    monkeypatch.setattr(settings, "google_client_id", "client")
    monkeypatch.setattr(settings, "google_oauth_redirect_uri", "http://testserver/api/auth/google/callback")
    app.dependency_overrides[get_repository_bundle] = lambda: bundle
    app.dependency_overrides[get_google_identity_provider] = lambda: fake
    try:
        client = TestClient(app, follow_redirects=False)
        start = client.get("/api/auth/google/start", params={"returnTo": "/records"})
        assert start.status_code == 302
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
        callback = client.get("/api/auth/google/callback", params={"state": state, "code": "fake-code"})
        assert callback.status_code == 302
        assert callback.headers["location"].endswith("/records")
        assert settings.session_cookie_name in callback.cookies
        assert client.get("/api/me").json()["email"] == "person@example.test"
    finally:
        app.dependency_overrides.pop(get_google_identity_provider, None)
        app.dependency_overrides.pop(get_repository_bundle, None)


def test_csrf_origin_policy_rejects_missing_and_accepts_allowlisted_origin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "csrf_mode", "origin")
    monkeypatch.setattr(settings, "csrf_allowed_origins", ["https://app.example.test"])
    test_app = create_app()
    bundle = create_in_memory_repository_bundle()
    test_app.dependency_overrides[get_repository_bundle] = lambda: bundle
    client = TestClient(test_app)
    client.cookies.set(settings.session_cookie_name, "unknown")
    assert client.post("/api/auth/logout").status_code == 403
    assert client.post("/api/auth/logout", headers={"Origin": "https://app.example.test"}).status_code == 200
    assert client.get("/api/me").status_code == 401


def test_production_rejects_unsafe_authentication_configuration() -> None:
    base = {
        "app_env": "production",
        "database_url": "postgresql+psycopg://user:pass@db/app",
        "migration_policy": "require_head",
        "repository_adapter": "postgresql",
    }
    with pytest.raises(ValidationError, match="AUTH_ADAPTER"):
        Settings(**base, auth_adapter="dev")
    with pytest.raises(ValidationError, match="Secure and HttpOnly"):
        Settings(
            **base,
            auth_adapter="google",
            google_client_id="id",
            google_client_secret="secret",
            google_oauth_redirect_uri="https://api.example.test/callback",
            google_oauth_allowed_redirect_uris=["https://api.example.test/callback"],
            session_cookie_secure=False,
            csrf_mode="origin",
        )
