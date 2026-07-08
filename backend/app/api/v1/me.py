from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.schemas.auth import CurrentUser
from app.services.auth_service import AuthService

router = APIRouter(tags=["auth"])


@router.get(
    "/me",
    response_model=CurrentUser,
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Unauthenticated"}},
)
def get_current_user(request: Request) -> CurrentUser | JSONResponse:
    session_id = request.cookies.get(settings.session_cookie_name)
    user = AuthService().get_current_user(session_id)

    if user is None:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authentication required.",
                },
            },
        )

    return user
