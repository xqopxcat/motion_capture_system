from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


def test_mock_login_returns_demo_user() -> None:
    client = TestClient(app)

    response = client.post("/api/auth/mock-login", json={"provider": "google"})
    body = response.json()

    assert response.status_code == 200
    assert body == {
        "user": {
            "userId": "user_demo",
            "email": "demo@example.com",
            "displayName": "Demo User",
            "avatarUrl": None,
            "provider": "google",
        },
    }


def test_mock_login_sets_backend_owned_session_cookie() -> None:
    client = TestClient(app)

    response = client.post("/api/auth/mock-login", json={"provider": "google"})

    assert response.status_code == 200
    assert settings.session_cookie_name in response.cookies
    assert response.cookies[settings.session_cookie_name].startswith("session_")
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "samesite=lax" in response.headers["set-cookie"].lower()


def test_dev_mock_login_returns_dev_user() -> None:
    client = TestClient(app)

    response = client.post("/api/auth/mock-login", json={"provider": "dev"})
    body = response.json()

    assert response.status_code == 200
    assert body["user"]["userId"] == "user_dev"
    assert body["user"]["provider"] == "dev"


def test_current_user_returns_401_without_session() -> None:
    client = TestClient(app)

    response = client.get("/api/me")

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Authentication required.",
        },
    }


def test_current_user_returns_401_for_invalid_session() -> None:
    client = TestClient(app)
    client.cookies.set(settings.session_cookie_name, "session_invalid")

    response = client.get("/api/me")

    assert response.status_code == 401


def test_current_user_returns_mock_login_user() -> None:
    client = TestClient(app)
    login_response = client.post("/api/auth/mock-login", json={"provider": "google"})

    response = client.get("/api/me")

    assert login_response.status_code == 200
    assert response.status_code == 200
    assert response.json() == login_response.json()["user"]


def test_logout_clears_cookie_and_invalidates_session() -> None:
    client = TestClient(app)
    login_response = client.post("/api/auth/mock-login", json={"provider": "google"})
    session_id = login_response.cookies[settings.session_cookie_name]

    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert response.cookies.get(settings.session_cookie_name) in (None, "")
    assert "max-age=0" in response.headers["set-cookie"].lower()
    assert client.get("/api/me").status_code == 401

    client.cookies.set(settings.session_cookie_name, session_id)
    assert client.get("/api/me").status_code == 401


def test_logout_without_session_is_idempotent() -> None:
    client = TestClient(app)

    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert "max-age=0" in response.headers["set-cookie"].lower()
