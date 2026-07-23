from dataclasses import dataclass

from app.schemas.auth import AuthProvider


@dataclass(frozen=True)
class StoredUser:
    user_id: str
    email: str
    display_name: str
    avatar_url: str | None
    provider: AuthProvider


class UserRepository:
    def __init__(self) -> None:
        self._users: dict[str, StoredUser] = {}
        self._provider_identities: dict[tuple[str, str], str] = {}

    def get(self, user_id: str) -> StoredUser | None:
        return self._users.get(user_id)

    def get_by_provider_identity(self, provider: str, provider_subject: str) -> StoredUser | None:
        user_id = self._provider_identities.get((provider, provider_subject))
        return None if user_id is None else self._users.get(user_id)

    def create(self, user: StoredUser, *, provider_subject: str) -> StoredUser:
        if user.user_id in self._users:
            raise ValueError("User already exists.")
        if (user.provider, provider_subject) in self._provider_identities:
            raise ValueError("Provider identity already exists.")
        self._users[user.user_id] = user
        self._provider_identities[(user.provider, provider_subject)] = user.user_id
        return user

    def update_profile(
        self,
        user_id: str,
        *,
        email: str,
        display_name: str,
        avatar_url: str | None,
    ) -> StoredUser:
        current = self._users.get(user_id)
        if current is None:
            raise KeyError(f"User does not exist: {user_id}")
        updated = StoredUser(
            user_id=current.user_id,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            provider=current.provider,
        )
        self._users[user_id] = updated
        return updated

    def get_or_create_demo_user(self, provider: AuthProvider) -> StoredUser:
        user_id = "user_demo" if provider == "google" else "user_dev"
        existing = self._users.get(user_id)

        if existing is not None:
            return existing

        user = StoredUser(
            user_id=user_id,
            email="demo@example.com" if provider == "google" else "dev@example.com",
            display_name="Demo User" if provider == "google" else "Dev User",
            avatar_url=None,
            provider=provider,
        )
        self._users[user.user_id] = user
        self._provider_identities[(provider, f"task61-test-{provider}")] = user.user_id

        return user
