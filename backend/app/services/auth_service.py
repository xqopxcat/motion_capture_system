from dataclasses import dataclass

from app.repositories.runtime_repositories import session_repository, user_repository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
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
                user=CurrentUser(
                    userId=user.user_id,
                    email=user.email,
                    displayName=user.display_name,
                    avatarUrl=user.avatar_url,
                    provider=user.provider,
                ),
            ),
            session_id=session.session_id,
        )
