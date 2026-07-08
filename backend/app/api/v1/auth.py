from fastapi import APIRouter, Request, Response

from app.core.config import settings
from app.schemas.auth import LogoutResponse, MockLoginRequest, MockLoginResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/mock-login", response_model=MockLoginResponse)
def mock_login(request: MockLoginRequest, response: Response) -> MockLoginResponse:
    result = AuthService().mock_login(request.provider)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=result.session_id,
        httponly=True,
        secure=False,
        samesite="lax",
    )

    return result.response


@router.post("/logout", response_model=LogoutResponse)
def logout(request: Request, response: Response) -> LogoutResponse:
    AuthService().logout(request.cookies.get(settings.session_cookie_name))
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        samesite="lax",
    )

    return LogoutResponse()
