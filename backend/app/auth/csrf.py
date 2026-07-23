import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


logger = logging.getLogger(__name__)


class OriginCsrfMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, cookie_name: str, allowed_origins: set[str], enabled: bool) -> None:
        super().__init__(app)
        self.cookie_name = cookie_name
        self.allowed_origins = allowed_origins
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        is_mutation = request.method in {"POST", "PUT", "PATCH", "DELETE"}
        is_authenticated = self.cookie_name in request.cookies
        if self.enabled and is_mutation and is_authenticated:
            origin = request.headers.get("origin")
            if origin not in self.allowed_origins:
                logger.warning("CSRF origin rejected")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": {"code": "CSRF_REJECTED", "message": "Request origin is not allowed."}},
                )
        return await call_next(request)
