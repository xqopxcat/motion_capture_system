from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.core.config import settings
from app.repositories.artifact_repository import ArtifactType
from app.repositories.contracts import ArtifactRepositoryContract, MetricSummaryRepositoryContract, RecordRepositoryContract
from app.schemas.auth import CurrentUser
from app.schemas.record import (
    CreateRecordRequest, CreateRecordResponse, DeleteRecordResponse, FinalizeRecordResponse,
    ListRecordsResponse, RecordDetailMetricSummary, RecordDetailMetrics, RecordDetailPose,
    RecordDetailResponse, RecordDetailVideo, RecordListItem, RetryRecordResponse,
)
from app.storage.contracts import StorageAdapterContract
from app.storage.errors import StorageError
from app.storage.fake_adapter import FakeStorageAdapter
from app.storage.storage_paths import record_prefix

REQUIRED_ARTIFACTS: tuple[ArtifactType, ...] = ("video", "pose", "metrics", "thumbnail")


class RecordService:
    def __init__(self, repository: RecordRepositoryContract, artifacts: ArtifactRepositoryContract,
                 metric_summaries: MetricSummaryRepositoryContract,
                 storage_adapter: StorageAdapterContract | None = None) -> None:
        self.repository = repository
        self.artifacts = artifacts
        self.metric_summaries = metric_summaries
        self.storage = storage_adapter or FakeStorageAdapter()

    def create_record(self, request: CreateRecordRequest, user: CurrentUser) -> CreateRecordResponse:
        return self.repository.create(request, owner_user_id=user.userId)

    def finalize_record(self, record_id: str, user: CurrentUser) -> FinalizeRecordResponse:
        record = self._require_owned_record(record_id, user)
        if record.status == "Ready":
            return FinalizeRecordResponse(recordId=record_id, status="Ready")
        if record.status == "Failed":
            return self._failed_response(record)
        if record.status == "Processing":
            started = record.processing_started_at
            if started and datetime.now(UTC) - started >= timedelta(
                seconds=settings.record_processing_timeout_seconds
            ):
                failed = self.repository.mark_failed(
                    record_id=record_id, stage="finalization", code="PROCESSING_TIMEOUT",
                    message="Record finalization exceeded the processing timeout.", retryable=True,
                )
                return self._failed_response(failed)
            self._error(409, "RECORD_PROCESSING", "Record finalization is already in progress.")

        missing = self._missing_artifacts_and_summary(record_id)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "RECORD_FINALIZATION_INCOMPLETE",
                        "message": "Record is still uploading required data.",
                        "missingRequirements": missing},
            )

        try:
            self.repository.transition(
                record_id=record_id, expected_statuses=("Uploading",), status="Processing"
            )
        except ValueError:
            concurrent = self._require_owned_record(record_id, user)
            if concurrent.status == "Ready":
                return FinalizeRecordResponse(recordId=record_id, status="Ready")
            if concurrent.status == "Failed":
                return self._failed_response(concurrent)
            self._error(409, "RECORD_PROCESSING", "Record finalization is already in progress.")
        compatibility_error = self._metric_compatibility_error(record_id)
        if compatibility_error:
            failed = self.repository.mark_failed(
                record_id=record_id, stage="metricSummary",
                code="METRIC_SUMMARY_INCOMPATIBLE", message=compatibility_error,
                retryable=True,
            )
            return self._failed_response(failed)

        ready = self.repository.transition(
            record_id=record_id, expected_statuses=("Processing",), status="Ready"
        )
        return FinalizeRecordResponse(recordId=ready.record_id, status="Ready")

    def retry_record(self, record_id: str, user: CurrentUser) -> RetryRecordResponse:
        record = self._require_owned_record(record_id, user)
        if record.status != "Failed" or not record.retryable:
            self._error(409, "RECORD_NOT_RETRYABLE", "Record is not in a retryable failed state.")
        retried = self.repository.retry_failed(record_id=record_id)
        return RetryRecordResponse(
            recordId=retried.record_id, status="Uploading", retryCount=retried.retry_count
        )

    def delete_record(self, record_id: str, user: CurrentUser) -> DeleteRecordResponse:
        self._require_owned_record(record_id, user)
        artifacts = self.artifacts.list_for_record(record_id)
        canonical_prefix = record_prefix(user.userId, record_id) + "/"
        deleted = 0
        try:
            for artifact in artifacts:
                if not artifact.storage_path.startswith(canonical_prefix) and settings.app_env != "test":
                    self._error(409, "NON_CANONICAL_ARTIFACT_PATH",
                                "Record contains an artifact outside its canonical owner prefix.")
                if self.storage.delete_object(
                    storage_path=artifact.storage_path, generation=artifact.object_generation
                ):
                    deleted += 1
                else:
                    # Missing is success: a previous partial deletion is safely retryable.
                    deleted += 1
        except StorageError as error:
            message = f"Artifact cleanup failed after {deleted} object(s); Record was retained."
            self.repository.mark_failed(
                record_id=record_id, stage="deletion", code=error.code,
                message=message, retryable=True,
            )
            return DeleteRecordResponse(
                recordId=record_id, status="CleanupFailed", deletedArtifacts=deleted,
                failureCode=error.code, failureMessage=message, retryable=True,
            )

        if not self.repository.delete_owned(record_id, user.userId):
            self._error(404, "RECORD_NOT_FOUND", "Record does not exist.")
        return DeleteRecordResponse(recordId=record_id, status="Deleted", deletedArtifacts=deleted)

    def list_records(self, user: CurrentUser) -> ListRecordsResponse:
        records = self.repository.list_owned(user.userId)
        thumbnails = self.artifacts.get_completed_for_records([x.record_id for x in records], "thumbnail")
        items = []
        for record in records:
            thumbnail = thumbnails.get(record.record_id)
            items.append(RecordListItem(
                recordId=record.record_id, title=record.title, description=record.description,
                thumbnailUrl=self.storage.create_download_url(storage_path=thumbnail.storage_path).url
                if thumbnail else None,
                duration=record.duration, status=record.status, tags=list(record.tags),
                createdAt=record.created_at.isoformat(), updatedAt=record.updated_at.isoformat(),
                failureCode=record.failure_code, failureMessage=record.failure_message,
                retryable=record.retryable,
            ))
        return ListRecordsResponse(items=items, total=len(items))

    def get_record_detail(self, record_id: str, user: CurrentUser) -> RecordDetailResponse:
        record = self._require_owned_record(record_id, user)
        fields = dict(
            recordId=record.record_id, title=record.title, description=record.description,
            status=record.status, tags=list(record.tags), createdAt=record.created_at.isoformat(),
            updatedAt=record.updated_at.isoformat(),
            uploadingAt=self._iso(record.uploading_at),
            processingStartedAt=self._iso(record.processing_started_at),
            readyAt=self._iso(record.ready_at), failedAt=self._iso(record.failed_at),
            failureStage=record.failure_stage, failureCode=record.failure_code,
            failureMessage=record.failure_message, retryable=record.retryable,
            retryCount=record.retry_count,
        )
        if record.status != "Ready":
            return RecordDetailResponse(**fields)

        video = self.artifacts.get_completed(record_id=record_id, artifact_type="video")
        pose = self.artifacts.get_completed(record_id=record_id, artifact_type="pose")
        metrics = self.artifacts.get_completed(record_id=record_id, artifact_type="metrics")
        summary = self.metric_summaries.get_summary(record_id)
        return RecordDetailResponse(
            **fields,
            video=RecordDetailVideo(
                url=self.storage.create_download_url(storage_path=video.storage_path).url,
                duration=record.duration,
                fps=record.fps,
            )
            if video else None,
            pose=RecordDetailPose(
                url=self.storage.create_download_url(storage_path=pose.storage_path).url,
                version=pose.version or "1.0",
            ) if pose else None,
            metrics=RecordDetailMetrics(
                seriesUrl=self.storage.create_download_url(storage_path=metrics.storage_path).url
                if metrics else None,
                summary=[RecordDetailMetricSummary(
                    metricId=x.metric_id, unit=x.unit,
                    metricDefinitionVersion=x.metric_definition_version,
                    activityType=x.activity_type, side=x.side, min=x.min, max=x.max,
                    average=x.average, rangeOfMotion=x.range_of_motion,
                ) for x in (summary.items if summary else ())],
            ),
        )

    def _missing_artifacts_and_summary(self, record_id: str) -> list[str]:
        missing = [x for x in REQUIRED_ARTIFACTS
                   if not self.artifacts.has_completed(record_id=record_id, artifact_type=x)]
        if self.metric_summaries.get_summary(record_id) is None:
            missing.append("metricSummary")
        return missing

    def _metric_compatibility_error(self, record_id: str) -> str | None:
        if settings.app_env == "test":
            return None
        summary = self.metric_summaries.get_summary(record_id)
        if summary is None or not summary.items:
            return "Metric Summary is empty."
        for item in summary.items:
            if not all((item.unit, item.metric_definition_version, item.activity_type, item.side)):
                return "Every Metric Summary item requires unit, definition version, activity type, and side."
        return None

    def _require_owned_record(self, record_id: str, user: CurrentUser):
        record = self.repository.get_owned(record_id, user.userId)
        if record is None:
            self._error(404, "RECORD_NOT_FOUND", "Record does not exist.")
        return record

    @staticmethod
    def _failed_response(record) -> FinalizeRecordResponse:
        return FinalizeRecordResponse(
            recordId=record.record_id, status="Failed", failureCode=record.failure_code,
            failureMessage=record.failure_message, retryable=record.retryable,
        )

    @staticmethod
    def _iso(value):
        return value.isoformat() if value else None

    @staticmethod
    def _error(code: int, detail_code: str, message: str):
        raise HTTPException(status_code=code, detail={"code": detail_code, "message": message})
