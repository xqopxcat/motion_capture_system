from fastapi import HTTPException, status

from app.repositories.artifact_repository import ArtifactRepository, ArtifactType
from app.repositories.metric_summary_repository import MetricSummaryRepository
from app.repositories.record_repository import RecordRepository
from app.repositories.runtime_repositories import (
    artifact_repository,
    metric_summary_repository,
    record_repository,
)
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
        repository: RecordRepository | None = None,
        artifacts: ArtifactRepository | None = None,
        metric_summaries: MetricSummaryRepository | None = None,
        signed_url_service: SignedUrlService | None = None,
    ) -> None:
        self.repository = repository or record_repository
        self.artifacts = artifacts or artifact_repository
        self.metric_summaries = metric_summaries or metric_summary_repository
        self.signed_url_service = signed_url_service or SignedUrlService()

    def create_record(self, request: CreateRecordRequest) -> CreateRecordResponse:
        return self.repository.create(request)

    def list_records(self) -> ListRecordsResponse:
        items = []
        for record in self.repository.list():
            thumbnail = self.artifacts.get_completed(
                record_id=record.record_id,
                artifact_type="thumbnail",
            )
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

    def finalize_record(self, record_id: str) -> FinalizeRecordResponse:
        if not self.repository.exists(record_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "RECORD_NOT_FOUND",
                    "message": "Record does not exist.",
                },
            )

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

    def get_record_detail(self, record_id: str) -> RecordDetailResponse:
        record = self.repository.get(record_id)
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "RECORD_NOT_FOUND",
                    "message": "Record does not exist.",
                },
            )

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
