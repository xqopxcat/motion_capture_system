from fastapi.testclient import TestClient

from app.main import app


def test_request_video_upload_url_returns_backend_storage_path() -> None:
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

    body = response.json()

    assert response.status_code == 200
    assert body["storagePath"] == "videos/record_123/video.webm"
    assert body["uploadUrl"].startswith("https://mock-storage.local/upload/")
    assert body["expiresAt"]


def test_request_pose_upload_url_returns_backend_storage_path() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/uploads/pose",
        json={
            "recordId": "record_123",
            "contentType": "application/json",
        },
    )

    assert response.status_code == 200
    assert response.json()["storagePath"] == "poses/record_123/pose.v1.json"


def test_request_metrics_upload_url_returns_backend_storage_path() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/uploads/metrics",
        json={
            "recordId": "record_123",
            "contentType": "application/json",
        },
    )

    assert response.status_code == 200
    assert response.json()["storagePath"] == "metrics/record_123/metric-series.v1.json"


def test_request_thumbnail_upload_url_returns_backend_storage_path() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/uploads/thumbnail",
        json={
            "recordId": "record_123",
            "contentType": "image/jpeg",
            "fileSize": 123456,
            "generatedFromFrameIndex": 0,
        },
    )

    assert response.status_code == 200
    assert response.json()["storagePath"] == "thumbnails/record_123/thumbnail.jpg"
