from fastapi.testclient import TestClient

from app.main import app
from app.repositories.runtime_repositories import RepositoryBundle


def test_create_record_returns_uploading_status() -> None:
    client = TestClient(app)
    _login(client)

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


def test_create_record_requires_authenticated_user() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/records",
        json={
            "title": "Squat Practice",
            "description": "Morning session",
            "tags": ["squat", "practice"],
        },
    )

    assert response.status_code == 401


def test_create_record_assigns_owner_from_current_user_and_ignores_request_owner(
    explicit_unit_repository_bundle: RepositoryBundle,
) -> None:
    client = TestClient(app)
    _login(client, provider="google")

    response = client.post(
        "/api/records",
        json={
            "title": "Squat Practice",
            "description": "Morning session",
            "tags": ["squat", "practice"],
            "ownerUserId": "user_dev",
        },
    )
    body = response.json()
    stored_record = explicit_unit_repository_bundle.records.get(body["recordId"])

    assert response.status_code == 201
    assert stored_record is not None
    assert stored_record.owner_user_id == "user_demo"


def test_list_records_returns_items_and_total() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.get("/api/records")
    body = response.json()

    assert response.status_code == 200
    assert body["total"] >= 1
    assert any(item["recordId"] == record_id for item in body["items"])
    record_item = next(item for item in body["items"] if item["recordId"] == record_id)
    assert record_item["title"] == "Squat Practice"
    assert record_item["status"] == "Uploading"
    assert record_item["duration"] is None
    assert record_item["tags"] == ["squat", "practice"]
    assert "video" not in record_item
    assert "pose" not in record_item
    assert "metrics" not in record_item


def test_list_records_returns_only_current_user_records() -> None:
    owner_client = TestClient(app)
    _login(owner_client, provider="google")
    owner_record_id = _create_record(owner_client)

    other_client = TestClient(app)
    _login(other_client, provider="dev")
    other_record_id = _create_record(other_client)

    owner_response = owner_client.get("/api/records")
    owner_body = owner_response.json()
    other_response = other_client.get("/api/records")
    other_body = other_response.json()

    assert owner_response.status_code == 200
    assert other_response.status_code == 200
    assert any(item["recordId"] == owner_record_id for item in owner_body["items"])
    assert all(item["recordId"] != other_record_id for item in owner_body["items"])
    assert any(item["recordId"] == other_record_id for item in other_body["items"])
    assert all(item["recordId"] != owner_record_id for item in other_body["items"])


def test_list_records_includes_thumbnail_url_when_thumbnail_is_complete() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/thumbnail/complete",
        json={
            "recordId": record_id,
            "storagePath": f"thumbnails/{record_id}/thumbnail.jpg",
            "generatedFromFrameIndex": 0,
        },
    )
    assert response.status_code == 200

    response = client.get("/api/records")
    body = response.json()
    record_item = next(item for item in body["items"] if item["recordId"] == record_id)

    assert record_item["thumbnailUrl"].startswith("https://mock-storage.local/download/")


def test_finalize_record_returns_ready_when_required_data_is_complete() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id)

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 200
    assert response.json() == {
        "recordId": record_id,
        "status": "Ready",
    }


def test_get_record_detail_returns_ready_record_artifact_urls() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id)
    assert client.post(f"/api/records/{record_id}/complete").status_code == 200

    response = client.get(f"/api/records/{record_id}")
    body = response.json()

    assert response.status_code == 200
    assert body["recordId"] == record_id
    assert body["title"] == "Squat Practice"
    assert body["status"] == "Ready"
    assert body["video"]["url"].startswith("https://mock-storage.local/download/")
    assert body["pose"]["url"].startswith("https://mock-storage.local/download/")
    assert body["pose"]["version"] == "1.0"
    assert body["metrics"]["seriesUrl"].startswith("https://mock-storage.local/download/")
    assert body["metrics"]["summary"][0]["metricId"] == "knee_flexion"


def test_get_record_detail_returns_non_ready_state_without_artifact_urls() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.get(f"/api/records/{record_id}")
    body = response.json()

    assert response.status_code == 200
    assert body["recordId"] == record_id
    assert body["status"] == "Uploading"
    assert body["video"] is None
    assert body["pose"] is None
    assert body["metrics"] is None


def test_finalize_record_fails_when_video_artifact_is_missing() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="video")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "RECORD_FINALIZATION_INCOMPLETE"
    assert "video" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_pose_artifact_is_missing() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="pose")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert "pose" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_metrics_artifact_is_missing() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="metrics")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert "metrics" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_thumbnail_artifact_is_missing() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="thumbnail")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert "thumbnail" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_metric_summary_is_missing(
    explicit_unit_repository_bundle: RepositoryBundle,
) -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    artifact_repository = explicit_unit_repository_bundle.artifacts
    artifact_repository.mark_complete(
        record_id=record_id,
        artifact_type="video",
        storage_path=f"videos/{record_id}/video.webm",
    )
    artifact_repository.mark_complete(
        record_id=record_id,
        artifact_type="pose",
        storage_path=f"poses/{record_id}/pose.v1.json",
        version="1.0",
    )
    artifact_repository.mark_complete(
        record_id=record_id,
        artifact_type="metrics",
        storage_path=f"metrics/{record_id}/metric-series.v1.json",
        version="1.0",
    )
    artifact_repository.mark_complete(
        record_id=record_id,
        artifact_type="thumbnail",
        storage_path=f"thumbnails/{record_id}/thumbnail.jpg",
        generated_from_frame_index=0,
    )

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert "metricSummary" in response.json()["detail"]["missingRequirements"]


def test_get_record_detail_returns_404_for_another_users_record() -> None:
    owner_client = TestClient(app)
    _login(owner_client, provider="google")
    record_id = _create_record(owner_client)

    other_client = TestClient(app)
    _login(other_client, provider="dev")

    response = other_client.get(f"/api/records/{record_id}")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "RECORD_NOT_FOUND"


def test_finalize_record_returns_404_for_another_users_record() -> None:
    owner_client = TestClient(app)
    _login(owner_client, provider="google")
    record_id = _create_record(owner_client)

    other_client = TestClient(app)
    _login(other_client, provider="dev")

    response = other_client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "RECORD_NOT_FOUND"


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


def _complete_all_artifacts(client: TestClient, record_id: str, skip: str | None = None) -> None:
    if skip != "video":
        assert client.post(
            "/api/uploads/video/complete",
            json={
                "recordId": record_id,
                "storagePath": f"videos/{record_id}/video.webm",
            },
        ).status_code == 200

    if skip != "pose":
        assert client.post(
            "/api/uploads/pose/complete",
            json={
                "recordId": record_id,
                "storagePath": f"poses/{record_id}/pose.v1.json",
                "version": "1.0",
            },
        ).status_code == 200

    if skip != "metrics":
        assert client.post(
            "/api/uploads/metrics/complete",
            json={
                "recordId": record_id,
                "storagePath": f"metrics/{record_id}/metric-series.v1.json",
                "version": "1.0",
                "summary": [
                    {
                        "metricId": "knee_flexion",
                        "min": 30,
                        "max": 120,
                        "average": 75,
                        "rangeOfMotion": 90,
                    },
                ],
            },
        ).status_code == 200

    if skip != "thumbnail":
        assert client.post(
            "/api/uploads/thumbnail/complete",
            json={
                "recordId": record_id,
                "storagePath": f"thumbnails/{record_id}/thumbnail.jpg",
                "generatedFromFrameIndex": 0,
            },
        ).status_code == 200
