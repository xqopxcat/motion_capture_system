from fastapi.testclient import TestClient

from app.main import app


def test_create_annotation_returns_created_annotation() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        f"/api/records/{record_id}/annotations",
        json={
            "frameIndex": 42,
            "timestamp": 1.4,
            "title": "Knee inward",
            "note": "Left knee moves inward during descent.",
        },
    )
    body = response.json()

    assert response.status_code == 201
    assert body["annotationId"].startswith("annotation_")
    assert body["recordId"] == record_id
    assert body["frameIndex"] == 42
    assert body["timestamp"] == 1.4
    assert body["title"] == "Knee inward"
    assert body["note"] == "Left knee moves inward during descent."
    assert body["authorUserId"] == "user_demo"
    assert body["createdAt"]
    assert body["updatedAt"]


def test_list_annotations_returns_record_annotations() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    create_response = client.post(
        f"/api/records/{record_id}/annotations",
        json={
            "frameIndex": 12,
            "timestamp": 0.4,
            "title": "Start descent",
            "note": "",
        },
    )
    assert create_response.status_code == 201

    response = client.get(f"/api/records/{record_id}/annotations")
    body = response.json()

    assert response.status_code == 200
    assert body["total"] >= 1
    assert any(
        item["annotationId"] == create_response.json()["annotationId"]
        for item in body["items"]
    )


def test_create_annotation_requires_authenticated_user() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/records/record_missing/annotations",
        json={
            "frameIndex": 1,
            "timestamp": 0.03,
            "title": "Marker",
            "note": "",
        },
    )

    assert response.status_code == 401


def test_create_annotation_returns_404_for_another_users_record() -> None:
    owner_client = TestClient(app)
    _login(owner_client, provider="google")
    record_id = _create_record(owner_client)

    other_client = TestClient(app)
    _login(other_client, provider="dev")

    response = other_client.post(
        f"/api/records/{record_id}/annotations",
        json={
            "frameIndex": 1,
            "timestamp": 0.03,
            "title": "Marker",
            "note": "",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "RECORD_NOT_FOUND"


def test_list_annotations_returns_404_for_another_users_record() -> None:
    owner_client = TestClient(app)
    _login(owner_client, provider="google")
    record_id = _create_record(owner_client)

    other_client = TestClient(app)
    _login(other_client, provider="dev")

    response = other_client.get(f"/api/records/{record_id}/annotations")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "RECORD_NOT_FOUND"


def test_create_annotation_rejects_blank_title() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        f"/api/records/{record_id}/annotations",
        json={
            "frameIndex": 1,
            "timestamp": 0.03,
            "title": "   ",
            "note": "",
        },
    )

    assert response.status_code == 422


def _login(client: TestClient, *, provider: str = "google") -> None:
    response = client.post("/api/auth/mock-login", json={"provider": provider})
    assert response.status_code == 200


def _create_record(client: TestClient) -> str:
    response = client.post(
        "/api/records",
        json={
            "title": "Squat Practice",
            "description": "Morning session",
            "tags": ["squat", "practice"],
        },
    )

    assert response.status_code == 201

    return response.json()["recordId"]
