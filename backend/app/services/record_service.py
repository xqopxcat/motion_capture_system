from fastapi import HTTPException, status

from app.repositories.artifact_repository import ArtifactType
from app.repositories.contracts import (
    ArtifactRepositoryContract,
    MetricSummaryRepositoryContract,
    RecordRepositoryContract,
)
from app.schemas.auth import CurrentUser
from app.schemas.record import CreateRecordRequest, CreateRecordResponse, FinalizeRecordResponse
from app.schemas.record import (
    ListRecordsResponse,
    RecordListItem,
    RecordDetailMetricSummary,
    RecordDetailMetrics,
    RecordDetailPose,
    RecordDetailResponse,
    RecordDetailVideo,
)
from app.storage.signed_url_service import SignedUrlService


REQUIRED_ARTIFACTS: tuple[ArtifactType, ...] = ("video", "pose", "metrics", "thumbnail")


class RecordService:
    def __init__(
        self,
        repository: RecordRepositoryContract,
        artifacts: ArtifactRepositoryContract,
        metric_summaries: MetricSummaryRepositoryContract,
        signed_url_service: SignedUrlService | None = None,
    ) -> None:
        self.repository = repository
        self.artifacts = artifacts
        self.metric_summaries = metric_summaries
        self.signed_url_service = signed_url_service or SignedUrlService()

    def create_record(self, request: CreateRecordRequest, user: CurrentUser) -> CreateRecordResponse:
        return self.repository.create(request, owner_user_id=user.userId)

    def list_records(self, user: CurrentUser) -> ListRecordsResponse:
        owned_records = self.repository.list_owned(user.userId)
        thumbnails = self.artifacts.get_completed_for_records(
            [record.record_id for record in owned_records],
            "thumbnail",
        )
        items = []
        for record in owned_records:
            thumbnail = thumbnails.get(record.record_id)
            items.append(
                RecordListItem(
                    recordId=record.record_id,
                    title=record.title,
                    description=record.description,
                    thumbnailUrl=self.signed_url_service.create_download_url(thumbnail.storage_path)
                    if thumbnail is not None
                    else None,
                    duration=None,
                    status=record.status,
                    tags=list(record.tags),
                    createdAt=record.created_at.isoformat(),
                ),
            )

        return ListRecordsResponse(items=items, total=len(items))

    def finalize_record(self, record_id: str, user: CurrentUser) -> FinalizeRecordResponse:
        self._require_owned_record(record_id, user)

        missing_requirements = self._missing_finalization_requirements(record_id)
        if missing_requirements:
            self.repository.update_status(record_id, "Failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "RECORD_FINALIZATION_INCOMPLETE",
                    "message": "Record cannot be finalized until all required artifacts and Metric Summary are complete.",
                    "missingRequirements": missing_requirements,
                },
            )

        record = self.repository.update_status(record_id, "Ready")

        return FinalizeRecordResponse(recordId=record.recordId, status="Ready")

    def get_record_detail(self, record_id: str, user: CurrentUser) -> RecordDetailResponse:
        record = self._require_owned_record(record_id, user)

        detail = RecordDetailResponse(
            recordId=record.record_id,
            title=record.title,
            description=record.description,
            status=record.status,
            tags=list(record.tags),
            createdAt=record.created_at.isoformat(),
        )

        if record.status != "Ready":
            return detail

        video = self.artifacts.get_completed(record_id=record_id, artifact_type="video")
        pose = self.artifacts.get_completed(record_id=record_id, artifact_type="pose")
        metrics = self.artifacts.get_completed(record_id=record_id, artifact_type="metrics")
        metric_summary = self.metric_summaries.get_summary(record_id)

        return RecordDetailResponse(
            recordId=record.record_id,
            title=record.title,
            description=record.description,
            status=record.status,
            video=RecordDetailVideo(
                url=self.signed_url_service.create_download_url(video.storage_path),
            )
            if video is not None
            else None,
            pose=RecordDetailPose(
                url=self.signed_url_service.create_download_url(pose.storage_path),
                version=pose.version or "1.0",
            )
            if pose is not None
            else None,
            metrics=RecordDetailMetrics(
                seriesUrl=self.signed_url_service.create_download_url(metrics.storage_path)
                if metrics is not None
                else None,
                summary=[
                    RecordDetailMetricSummary(
                        metricId=item.metric_id,
                        unit=item.unit,
                        metricDefinitionVersion=item.metric_definition_version,
                        activityType=item.activity_type,
                        side=item.side,
                        min=item.min,
                        max=item.max,
                        average=item.average,
                        rangeOfMotion=item.range_of_motion,
                    )
                    for item in (metric_summary.items if metric_summary is not None else ())
                ],
            ),
            tags=list(record.tags),
            createdAt=record.created_at.isoformat(),
        )

    def _missing_finalization_requirements(self, record_id: str) -> list[str]:
        missing = [
            artifact_type
            for artifact_type in REQUIRED_ARTIFACTS
            if not self.artifacts.has_completed(record_id=record_id, artifact_type=artifact_type)
        ]

        if self.metric_summaries.get_summary(record_id) is None:
            missing.append("metricSummary")

        return missing

    def _require_owned_record(self, record_id: str, user: CurrentUser):
        record = self.repository.get_owned(record_id, user.userId)
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "RECORD_NOT_FOUND",
                    "message": "Record does not exist.",
                },
            )

        return record
