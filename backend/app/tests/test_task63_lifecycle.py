from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.repositories.artifact_repository import ArtifactRepository
from app.repositories.metric_summary_repository import MetricSummaryItemRecord, MetricSummaryRepository
from app.repositories.record_repository import RecordRepository
from app.schemas.auth import CurrentUser
from app.schemas.record import CreateRecordRequest
from app.services.record_service import RecordService
from app.storage.errors import StorageProviderError
from app.storage.fake_adapter import FakeStorageAdapter


USER = CurrentUser(
    userId="user_task63",
    email="task63@example.com",
    displayName="Task 63",
    avatarUrl=None,
    provider="dev",
)


def _service():
    records = RecordRepository()
    artifacts = ArtifactRepository()
    summaries = MetricSummaryRepository()
    storage = FakeStorageAdapter()
    service = RecordService(records, artifacts, summaries, storage)
    record_id = records.create(
        CreateRecordRequest(title="Lifecycle"), owner_user_id=USER.userId
    ).recordId
    return service, records, artifacts, summaries, storage, record_id


def _complete_required(artifacts, summaries, record_id: str, *, compatible: bool) -> None:
    for artifact_type, path in (
        ("video", f"users/{USER.userId}/records/{record_id}/video/video.webm"),
        ("pose", f"users/{USER.userId}/records/{record_id}/pose/pose.v1.json"),
        ("metrics", f"users/{USER.userId}/records/{record_id}/metrics/metric-series.v1.json"),
        ("thumbnail", f"users/{USER.userId}/records/{record_id}/thumbnail/thumbnail.jpg"),
    ):
        artifacts.mark_complete(
            record_id=record_id, artifact_type=artifact_type, storage_path=path
        )
    summaries.persist_summary(
        record_id=record_id,
        items=[MetricSummaryItemRecord(
            metric_id="knee_flexion",
            unit="degree" if compatible else None,
            metric_definition_version="knee-flexion.v1" if compatible else None,
            activity_type="squat" if compatible else None,
            side="left" if compatible else None,
            min=10, max=90, average=50, range_of_motion=80,
        )],
    )


def test_incompatible_metric_summary_fails_then_retries(monkeypatch) -> None:
    service, records, artifacts, summaries, _, record_id = _service()
    _complete_required(artifacts, summaries, record_id, compatible=False)
    monkeypatch.setattr(settings, "app_env", "local")

    failed = service.finalize_record(record_id, USER)
    persisted = records.get(record_id)

    assert failed.status == "Failed"
    assert failed.failureCode == "METRIC_SUMMARY_INCOMPATIBLE"
    assert failed.retryable is True
    assert persisted is not None and persisted.status == "Failed"
    assert persisted.processing_started_at is not None

    retried = service.retry_record(record_id, USER)
    assert retried.status == "Uploading"
    assert retried.retryCount == 1


def test_processing_timeout_becomes_retryable_failure(monkeypatch) -> None:
    service, records, _, _, _, record_id = _service()
    records.transition(
        record_id=record_id, expected_statuses=("Uploading",), status="Processing"
    )
    current = records.get(record_id)
    assert current is not None
    records._records[record_id] = type(current)(
        **{**current.__dict__, "processing_started_at": datetime.now(UTC) - timedelta(minutes=5)}
    )
    monkeypatch.setattr(settings, "record_processing_timeout_seconds", 30)

    response = service.finalize_record(record_id, USER)

    assert response.status == "Failed"
    assert response.failureCode == "PROCESSING_TIMEOUT"
    assert response.retryable is True


class FailingDeleteStorage(FakeStorageAdapter):
    def delete_object(self, *, storage_path: str, generation: str | None = None) -> bool:
        raise StorageProviderError("Injected provider failure.")


def test_storage_cleanup_failure_retains_postgresql_record() -> None:
    _, records, artifacts, summaries, _, record_id = _service()
    _complete_required(artifacts, summaries, record_id, compatible=True)
    service = RecordService(records, artifacts, summaries, FailingDeleteStorage())

    result = service.delete_record(record_id, USER)

    assert result.status == "CleanupFailed"
    assert result.retryable is True
    assert records.get_owned(record_id, USER.userId) is not None
    assert records.get(record_id).failure_stage == "deletion"
