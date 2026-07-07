from fastapi.testclient import TestClient

from app.main import app
from app.repositories.runtime_repositories import artifact_repository


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


def test_finalize_record_returns_ready_when_required_data_is_complete() -> None:
    client = TestClient(app)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id)

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 200
    assert response.json() == {
        "recordId": record_id,
        "status": "Ready",
    }


def test_finalize_record_fails_when_video_artifact_is_missing() -> None:
    client = TestClient(app)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="video")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "RECORD_FINALIZATION_INCOMPLETE"
    assert "video" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_pose_artifact_is_missing() -> None:
    client = TestClient(app)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="pose")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert "pose" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_metrics_artifact_is_missing() -> None:
    client = TestClient(app)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="metrics")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert "metrics" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_thumbnail_artifact_is_missing() -> None:
    client = TestClient(app)
    record_id = _create_record(client)

    _complete_all_artifacts(client, record_id, skip="thumbnail")

    response = client.post(f"/api/records/{record_id}/complete")

    assert response.status_code == 400
    assert "thumbnail" in response.json()["detail"]["missingRequirements"]


def test_finalize_record_fails_when_metric_summary_is_missing() -> None:
    client = TestClient(app)
    record_id = _create_record(client)

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
