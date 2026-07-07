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


REQUIRED_ARTIFACTS: tuple[ArtifactType, ...] = ("video", "pose", "metrics", "thumbnail")


class RecordService:
    def __init__(
        self,
        repository: RecordRepository | None = None,
        artifacts: ArtifactRepository | None = None,
        metric_summaries: MetricSummaryRepository | None = None,
    ) -> None:
        self.repository = repository or record_repository
        self.artifacts = artifacts or artifact_repository
        self.metric_summaries = metric_summaries or metric_summary_repository

    def create_record(self, request: CreateRecordRequest) -> CreateRecordResponse:
        return self.repository.create(request)

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

    def _missing_finalization_requirements(self, record_id: str) -> list[str]:
        missing = [
            artifact_type
            for artifact_type in REQUIRED_ARTIFACTS
            if not self.artifacts.has_completed(record_id=record_id, artifact_type=artifact_type)
        ]

        if self.metric_summaries.get_summary(record_id) is None:
            missing.append("metricSummary")

        return missing
