from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4


@dataclass(frozen=True)
class StoredSession:
    session_id: str
    user_id: str
    created_at: datetime


class SessionRepository:
    def __init__(self) -> None:
        self._sessions: dict[str, StoredSession] = {}

    def create_for_user(self, user_id: str) -> StoredSession:
        session = StoredSession(
            session_id=f"session_{uuid4().hex}",
            user_id=user_id,
            created_at=datetime.now(UTC),
        )
        self._sessions[session.session_id] = session

        return session
