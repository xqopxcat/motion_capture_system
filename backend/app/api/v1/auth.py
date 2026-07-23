from fastapi import APIRouter, Request, Response

from app.core.config import settings
from fastapi import Depends

from app.api.deps import get_auth_service
from app.schemas.auth import LogoutResponse, MockLoginRequest, MockLoginResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/mock-login", response_model=MockLoginResponse)
def mock_login(
    request: MockLoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> MockLoginResponse:
    result = service.mock_login(request.provider)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=result.session_id,
        httponly=True,
        secure=False,
        samesite="lax",
    )

    return result.response


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:
    service.logout(request.cookies.get(settings.session_cookie_name))
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        samesite="lax",
    )

    return LogoutResponse()
