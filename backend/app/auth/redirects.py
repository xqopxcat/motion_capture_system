from urllib.parse import unquote, urlsplit

from app.auth.errors import InvalidRedirectError


def validated_return_path(value: str | None, *, frontend_origin: str, default: str = "/dashboard") -> str:
    if value is None or value == "":
        return default
    decoded = value
    for _ in range(3):
        next_value = unquote(decoded)
        if next_value == decoded:
            break
        decoded = next_value
    if any(char in decoded for char in ("\r", "\n", "\\", "\x00")) or decoded.startswith("//"):
        raise InvalidRedirectError("Return destination is not allowed.")
    parsed = urlsplit(decoded)
    if parsed.scheme or parsed.netloc:
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin != frontend_origin or parsed.scheme not in {"http", "https"}:
            raise InvalidRedirectError("Return destination is not allowed.")
        decoded = parsed.path or "/"
        if parsed.query:
            decoded += f"?{parsed.query}"
    if not decoded.startswith("/") or decoded.startswith("//"):
        raise InvalidRedirectError("Return destination must be an approved frontend path.")
    return decoded


def frontend_redirect(frontend_origin: str, path: str) -> str:
    return f"{frontend_origin.rstrip('/')}{path}"
