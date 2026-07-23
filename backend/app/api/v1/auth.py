import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse

from app.api.deps import get_auth_service, get_oauth_service
from app.auth.errors import AuthenticationFlowError, InvalidRedirectError
from app.auth.redirects import frontend_redirect, validated_return_path
from app.core.config import settings
from app.schemas.auth import LogoutResponse, MockLoginRequest, MockLoginResponse
from app.services.auth_service import AuthService
from app.services.oauth_service import OAuthService

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_lifetime_seconds,
        httponly=settings.session_cookie_http_only,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_same_site,
        domain=settings.session_cookie_domain,
        path=settings.session_cookie_path,
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=settings.session_cookie_http_only,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_same_site,
        domain=settings.session_cookie_domain,
        path=settings.session_cookie_path,
    )


@router.get("/google/start")
def google_start(
    return_to: str | None = Query(default=None, alias="returnTo"),
    service: OAuthService = Depends(get_oauth_service),
) -> RedirectResponse:
    if settings.auth_adapter != "google":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    try:
        return_path = validated_return_path(return_to, frontend_origin=settings.frontend_origin)
    except InvalidRedirectError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "AUTH_REDIRECT_INVALID", "message": str(error)},
        ) from error
    return RedirectResponse(service.start(return_path).authorization_url, status_code=status.HTTP_302_FOUND)


@router.get("/google/callback")
def google_callback(
    state_value: str | None = Query(default=None, alias="state"),
    code: str | None = None,
    service: OAuthService = Depends(get_oauth_service),
) -> RedirectResponse:
    if settings.auth_adapter != "google":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    try:
        if not state_value or not code:
            raise AuthenticationFlowError("OAuth callback is incomplete.")
        result = service.complete(state=state_value, code=code)
    except AuthenticationFlowError as error:
        logger.warning("OAuth callback rejected: %s", type(error).__name__)
        return RedirectResponse(
            frontend_redirect(settings.frontend_origin, "/login?error=authentication_failed"),
            status_code=status.HTTP_302_FOUND,
        )
    response = RedirectResponse(
        frontend_redirect(settings.frontend_origin, result.return_path),
        status_code=status.HTTP_302_FOUND,
    )
    _set_session_cookie(response, result.session_token)
    return response


@router.post("/mock-login", response_model=MockLoginResponse)
def mock_login(
    request_body: MockLoginRequest,
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> MockLoginResponse:
    allowed_test = settings.app_env == "test" and settings.auth_adapter == "test"
    origin = request.headers.get("origin")
    allowed_local = (
        settings.app_env == "local"
        and settings.auth_adapter == "dev"
        and settings.dev_auth_enabled
        and origin in settings.dev_auth_allowed_origins
        and request_body.provider == "dev"
    )
    if not (allowed_test or allowed_local):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    result = service.mock_login(request_body.provider)
    _set_session_cookie(response, result.session_id)
    return result.response


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:
    service.logout(request.cookies.get(settings.session_cookie_name))
    _clear_session_cookie(response)
    return LogoutResponse()
