from fastapi import Cookie, HTTPException, status

from app.core.config import settings
from app.schemas.auth import CurrentUser
from app.services.auth_service import AuthService


def current_user(
    session_id: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> CurrentUser:
    user = AuthService().get_current_user(session_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Authentication required.",
            },
        )

    return user
