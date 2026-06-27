from app.core.security import get_current_user_placeholder


def current_user() -> None:
    return get_current_user_placeholder()
