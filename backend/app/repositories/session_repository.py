from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe


@dataclass(frozen=True)
class StoredSession:
    session_id: str
    user_id: str
    created_at: datetime
    expires_at: datetime | None = None
    revoked_at: datetime | None = None


class SessionRepository:
    def __init__(self, lifetime: timedelta = timedelta(hours=24)) -> None:
        self._sessions: dict[str, StoredSession] = {}
        self.lifetime = lifetime

    def create_for_user(self, user_id: str) -> StoredSession:
        session = StoredSession(
            session_id=f"session_{token_urlsafe(32)}",
            user_id=user_id,
            created_at=datetime.now(UTC),
            expires_at=datetime.now(UTC) + self.lifetime,
        )
        self._sessions[session.session_id] = session

        return session

    def get(self, session_id: str) -> StoredSession | None:
        return self._sessions.get(session_id)

    def get_active(self, session_id: str, *, now: datetime | None = None) -> StoredSession | None:
        session = self.get(session_id)
        reference = now or datetime.now(UTC)
        if session is None or session.revoked_at is not None:
            return None
        if session.expires_at is not None and session.expires_at <= reference:
            return None
        return session

    def revoke(self, session_id: str, *, revoked_at: datetime | None = None) -> bool:
        current = self._sessions.get(session_id)
        if current is None:
            return False
        self._sessions[session_id] = StoredSession(
            session_id=current.session_id,
            user_id=current.user_id,
            created_at=current.created_at,
            expires_at=current.expires_at,
            revoked_at=revoked_at or datetime.now(UTC),
        )
        return True

    def delete(self, session_id: str) -> bool:
        return self._sessions.pop(session_id, None) is not None

    def delete_expired(self, *, now: datetime | None = None) -> int:
        reference = now or datetime.now(UTC)
        expired = [
            session_id
            for session_id, session in self._sessions.items()
            if session.expires_at is not None and session.expires_at <= reference
        ]
        for session_id in expired:
            del self._sessions[session_id]
        return len(expired)
