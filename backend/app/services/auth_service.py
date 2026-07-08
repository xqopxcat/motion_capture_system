from dataclasses import dataclass

from app.repositories.runtime_repositories import session_repository, user_repository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import StoredUser, UserRepository
from app.schemas.auth import AuthProvider, CurrentUser, MockLoginResponse


@dataclass(frozen=True)
class MockLoginResult:
    response: MockLoginResponse
    session_id: str


class AuthService:
    def __init__(
        self,
        users: UserRepository | None = None,
        sessions: SessionRepository | None = None,
    ) -> None:
        self.users = users or user_repository
        self.sessions = sessions or session_repository

    def mock_login(self, provider: AuthProvider) -> MockLoginResult:
        user = self.users.get_or_create_demo_user(provider)
        session = self.sessions.create_for_user(user.user_id)

        return MockLoginResult(
            response=MockLoginResponse(
                user=self._to_current_user(user),
            ),
            session_id=session.session_id,
        )

    def get_current_user(self, session_id: str | None) -> CurrentUser | None:
        if session_id is None:
            return None

        session = self.sessions.get(session_id)
        if session is None:
            return None

        user = self.users.get(session.user_id)
        if user is None:
            return None

        return self._to_current_user(user)

    def logout(self, session_id: str | None) -> None:
        if session_id is not None:
            self.sessions.delete(session_id)

    @staticmethod
    def _to_current_user(user: StoredUser) -> CurrentUser:
        return CurrentUser(
            userId=user.user_id,
            email=user.email,
            displayName=user.display_name,
            avatarUrl=user.avatar_url,
            provider=user.provider,
        )
