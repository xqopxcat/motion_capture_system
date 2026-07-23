from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe


@dataclass(frozen=True)
class StoredOAuthAttempt:
    code_verifier: str
    nonce: str
    return_path: str
    expires_at: datetime


class OAuthAttemptRepository:
    def __init__(self, lifetime: timedelta = timedelta(minutes=10)) -> None:
        self.lifetime = lifetime
        self._attempts: dict[str, tuple[StoredOAuthAttempt, bool]] = {}

    @staticmethod
    def hash_state(state: str) -> str:
        return sha256(state.encode("utf-8")).hexdigest()

    def create(self, *, code_verifier: str, nonce: str, return_path: str) -> tuple[str, StoredOAuthAttempt]:
        state = token_urlsafe(32)
        attempt = StoredOAuthAttempt(code_verifier, nonce, return_path, datetime.now(UTC) + self.lifetime)
        self._attempts[self.hash_state(state)] = (attempt, False)
        return state, attempt

    def consume(self, state: str, *, now: datetime | None = None) -> StoredOAuthAttempt | None:
        key = self.hash_state(state)
        entry = self._attempts.get(key)
        reference = now or datetime.now(UTC)
        if entry is None or entry[1] or entry[0].expires_at <= reference:
            return None
        self._attempts[key] = (entry[0], True)
        return entry[0]

    def delete_expired(self, *, now: datetime | None = None) -> int:
        reference = now or datetime.now(UTC)
        keys = [key for key, (attempt, consumed) in self._attempts.items() if consumed or attempt.expires_at <= reference]
        for key in keys:
            del self._attempts[key]
        return len(keys)
