from typing import Literal

from pydantic import BaseModel


AuthProvider = Literal["google", "dev"]


class CurrentUser(BaseModel):
    userId: str
    email: str
    displayName: str
    avatarUrl: str | None = None
    provider: AuthProvider


class MockLoginRequest(BaseModel):
    provider: AuthProvider = "google"


class MockLoginResponse(BaseModel):
    user: CurrentUser
