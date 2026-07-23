from base64 import urlsafe_b64encode
from dataclasses import dataclass
from hashlib import sha256
from secrets import token_urlsafe
from urllib.parse import urlencode
from uuid import uuid4

from app.auth.errors import InvalidOAuthStateError
from app.auth.google_provider import GoogleIdentity, GoogleIdentityProviderContract
from app.repositories.contracts import (
    OAuthAttemptRepositoryContract,
    SessionRepositoryContract,
    UserRepositoryContract,
)
from app.repositories.errors import DuplicateResourceError
from app.repositories.user_repository import StoredUser


@dataclass(frozen=True)
class OAuthStart:
    authorization_url: str


@dataclass(frozen=True)
class OAuthCompletion:
    session_token: str
    return_path: str


class OAuthService:
    authorization_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"

    def __init__(
        self,
        attempts: OAuthAttemptRepositoryContract,
        users: UserRepositoryContract,
        sessions: SessionRepositoryContract,
        provider: GoogleIdentityProviderContract,
        *,
        client_id: str,
        redirect_uri: str,
    ) -> None:
        self.attempts = attempts
        self.users = users
        self.sessions = sessions
        self.provider = provider
        self.client_id = client_id
        self.redirect_uri = redirect_uri

    def start(self, return_path: str) -> OAuthStart:
        verifier = token_urlsafe(64)
        nonce = token_urlsafe(32)
        state, _ = self.attempts.create(code_verifier=verifier, nonce=nonce, return_path=return_path)
        challenge = urlsafe_b64encode(sha256(verifier.encode("ascii")).digest()).rstrip(b"=").decode("ascii")
        query = urlencode(
            {
                "client_id": self.client_id,
                "redirect_uri": self.redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
                "nonce": nonce,
                "code_challenge": challenge,
                "code_challenge_method": "S256",
                "prompt": "select_account",
            },
        )
        return OAuthStart(f"{self.authorization_endpoint}?{query}")

    def complete(self, *, state: str, code: str) -> OAuthCompletion:
        attempt = self.attempts.consume(state)
        if attempt is None:
            raise InvalidOAuthStateError("OAuth state is missing, expired, mismatched, or already used.")
        identity = self.provider.exchange(code=code, code_verifier=attempt.code_verifier, expected_nonce=attempt.nonce)
        user = self._map_user(identity)
        session = self.sessions.create_for_user(user.user_id)
        return OAuthCompletion(session.session_id, attempt.return_path)

    def _map_user(self, identity: GoogleIdentity) -> StoredUser:
        existing = self.users.get_by_provider_identity("google", identity.subject)
        if existing is not None:
            return self.users.update_profile(
                existing.user_id,
                email=identity.email,
                display_name=identity.display_name,
                avatar_url=identity.avatar_url,
            )
        candidate = StoredUser(
            user_id=f"user_{uuid4().hex}",
            email=identity.email,
            display_name=identity.display_name,
            avatar_url=identity.avatar_url,
            provider="google",
        )
        try:
            return self.users.create(candidate, provider_subject=identity.subject)
        except DuplicateResourceError:
            raced = self.users.get_by_provider_identity("google", identity.subject)
            if raced is None:
                raise
            return raced
