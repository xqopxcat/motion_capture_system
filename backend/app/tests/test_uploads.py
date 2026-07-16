from fastapi.testclient import TestClient

from app.main import app
from app.repositories.runtime_repositories import metric_summary_repository


def test_request_video_upload_url_returns_backend_storage_path() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/video",
        json={
            "recordId": record_id,
            "fileName": "video.webm",
            "contentType": "video/webm",
            "fileSize": 123456,
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["storagePath"] == f"videos/{record_id}/video.webm"
    assert body["uploadUrl"].startswith("https://mock-storage.local/upload/")
    assert body["expiresAt"]


def test_request_pose_upload_url_returns_backend_storage_path() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/pose",
        json={
            "recordId": record_id,
            "contentType": "application/json",
        },
    )

    assert response.status_code == 200
    assert response.json()["storagePath"] == f"poses/{record_id}/pose.v1.json"


def test_request_metrics_upload_url_returns_backend_storage_path() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/metrics",
        json={
            "recordId": record_id,
            "contentType": "application/json",
        },
    )

    assert response.status_code == 200
    assert response.json()["storagePath"] == f"metrics/{record_id}/metric-series.v1.json"


def test_request_thumbnail_upload_url_returns_backend_storage_path() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/thumbnail",
        json={
            "recordId": record_id,
            "contentType": "image/jpeg",
            "fileSize": 123456,
            "generatedFromFrameIndex": 0,
        },
    )

    assert response.status_code == 200
    assert response.json()["storagePath"] == f"thumbnails/{record_id}/thumbnail.jpg"


def test_complete_video_upload_returns_complete_status() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/video/complete",
        json={
            "recordId": record_id,
            "storagePath": f"videos/{record_id}/video.webm",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "recordId": record_id,
        "artifactType": "video",
        "storagePath": f"videos/{record_id}/video.webm",
        "status": "Complete",
    }


def test_complete_pose_upload_returns_complete_status() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/pose/complete",
        json={
            "recordId": record_id,
            "storagePath": f"poses/{record_id}/pose.v1.json",
            "version": "1.0",
        },
    )

    assert response.status_code == 200
    assert response.json()["artifactType"] == "pose"
    assert response.json()["status"] == "Complete"


def test_complete_metrics_upload_persists_metric_summary() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
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
    )

    assert response.status_code == 200
    assert response.json()["artifactType"] == "metrics"
    assert response.json()["status"] == "Complete"
    assert response.json()["summaryPersisted"] is True


def test_complete_metrics_upload_persists_trend_compatibility_metadata() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/metrics/complete",
        json={
            "recordId": record_id,
            "storagePath": f"metrics/{record_id}/metric-series.v1.json",
            "version": "1.0",
            "summary": [
                {
                    "metricId": "knee_flexion",
                    "unit": "degree",
                    "metricDefinitionVersion": "knee-flexion.v1",
                    "activityType": "squat",
                    "side": "left",
                    "min": 30,
                    "max": 120,
                    "average": 75,
                    "rangeOfMotion": 90,
                },
            ],
        },
    )
    persisted = metric_summary_repository.get_summary(record_id)

    assert response.status_code == 200
    assert persisted is not None
    assert persisted.items[0].unit == "degree"
    assert persisted.items[0].metric_definition_version == "knee-flexion.v1"
    assert persisted.items[0].activity_type == "squat"
    assert persisted.items[0].side == "left"


def test_complete_thumbnail_upload_returns_complete_status() -> None:
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
    assert response.json()["artifactType"] == "thumbnail"
    assert response.json()["status"] == "Complete"


def test_complete_upload_rejects_invalid_storage_path() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/video/complete",
        json={
            "recordId": record_id,
            "storagePath": f"poses/{record_id}/pose.v1.json",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_STORAGE_PATH"


def test_complete_upload_rejects_record_path_mismatch() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/pose/complete",
        json={
            "recordId": record_id,
            "storagePath": "poses/record_456/pose.v1.json",
            "version": "1.0",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_STORAGE_PATH"


def test_complete_metrics_upload_requires_summary() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/metrics/complete",
        json={
            "recordId": record_id,
            "storagePath": f"metrics/{record_id}/metric-series.v1.json",
            "version": "1.0",
        },
    )

    assert response.status_code == 422


def test_complete_metrics_upload_rejects_invalid_metric_id() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/metrics/complete",
        json={
            "recordId": record_id,
            "storagePath": f"metrics/{record_id}/metric-series.v1.json",
            "version": "1.0",
            "summary": [
                {
                    "metricId": "",
                    "min": 30,
                    "max": 120,
                    "average": 75,
                    "rangeOfMotion": 90,
                },
            ],
        },
    )

    assert response.status_code == 422


def test_complete_metrics_upload_rejects_invalid_range_of_motion() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
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
                    "rangeOfMotion": -1,
                },
            ],
        },
    )

    assert response.status_code == 422


def test_complete_metrics_upload_rejects_max_less_than_min() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/metrics/complete",
        json={
            "recordId": record_id,
            "storagePath": f"metrics/{record_id}/metric-series.v1.json",
            "version": "1.0",
            "summary": [
                {
                    "metricId": "knee_flexion",
                    "min": 120,
                    "max": 30,
                    "average": 75,
                    "rangeOfMotion": 90,
                },
            ],
        },
    )

    assert response.status_code == 422


def test_complete_metrics_upload_rejects_record_path_mismatch() -> None:
    client = TestClient(app)
    _login(client)
    record_id = _create_record(client)

    response = client.post(
        "/api/uploads/metrics/complete",
        json={
            "recordId": record_id,
            "storagePath": "metrics/record_456/metric-series.v1.json",
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
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_STORAGE_PATH"


def test_request_upload_url_requires_authenticated_user() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/uploads/video",
        json={
            "recordId": "record_123",
            "fileName": "video.webm",
            "contentType": "video/webm",
            "fileSize": 123456,
        },
    )

    assert response.status_code == 401


def test_request_upload_url_blocks_another_users_record() -> None:
    owner_client = TestClient(app)
    _login(owner_client, provider="google")
    record_id = _create_record(owner_client)

    other_client = TestClient(app)
    _login(other_client, provider="dev")

    response = other_client.post(
        "/api/uploads/video",
        json={
            "recordId": record_id,
            "fileName": "video.webm",
            "contentType": "video/webm",
            "fileSize": 123456,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "RECORD_NOT_FOUND"


def test_complete_upload_blocks_another_users_record() -> None:
    owner_client = TestClient(app)
    _login(owner_client, provider="google")
    record_id = _create_record(owner_client)

    other_client = TestClient(app)
    _login(other_client, provider="dev")

    response = other_client.post(
        "/api/uploads/video/complete",
        json={
            "recordId": record_id,
            "storagePath": f"videos/{record_id}/video.webm",
        },
    )

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
