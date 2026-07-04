from fastapi.testclient import TestClient

from app.main import app


def test_create_record_returns_uploading_status() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/records",
        json={
            "title": "Squat Practice",
            "description": "Morning session",
            "tags": ["squat", "practice"],
        },
    )

    body = response.json()

    assert response.status_code == 201
    assert body["recordId"].startswith("record_")
    assert body["status"] == "Uploading"
