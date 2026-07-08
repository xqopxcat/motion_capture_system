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
