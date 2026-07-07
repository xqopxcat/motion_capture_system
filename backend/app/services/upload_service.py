from fastapi import HTTPException, status

from app.repositories.artifact_repository import ArtifactRepository, ArtifactType
from app.repositories.metric_summary_repository import MetricSummaryItemRecord, MetricSummaryRepository
from app.schemas.upload import (
    ArtifactCompleteResponse,
    MetricsUploadCompleteRequest,
    MetricsUploadCompleteResponse,
    MetricsUploadUrlRequest,
    PoseUploadUrlRequest,
    PoseUploadCompleteRequest,
    SignedUploadUrlResponse,
    ThumbnailUploadCompleteRequest,
    ThumbnailUploadUrlRequest,
    VideoUploadCompleteRequest,
    VideoUploadUrlRequest,
)
from app.storage.signed_url_service import SignedUrlService
from app.storage.storage_paths import (
    build_metrics_storage_path,
    build_pose_storage_path,
    build_thumbnail_storage_path,
    build_video_storage_path,
    is_metrics_storage_path_for_record,
    is_pose_storage_path_for_record,
    is_thumbnail_storage_path_for_record,
    is_video_storage_path_for_record,
)


class UploadService:
    def __init__(
        self,
        signed_url_service: SignedUrlService | None = None,
        artifact_repository: ArtifactRepository | None = None,
        metric_summary_repository: MetricSummaryRepository | None = None,
    ) -> None:
        self.signed_url_service = signed_url_service or SignedUrlService()
        self.artifact_repository = artifact_repository or ArtifactRepository()
        self.metric_summary_repository = metric_summary_repository or MetricSummaryRepository()

    def request_video_upload_url(self, request: VideoUploadUrlRequest) -> SignedUploadUrlResponse:
        storage_path = build_video_storage_path(request.recordId, request.fileName)

        return self._build_response(storage_path)

    def request_pose_upload_url(self, request: PoseUploadUrlRequest) -> SignedUploadUrlResponse:
        storage_path = build_pose_storage_path(request.recordId)

        return self._build_response(storage_path)

    def request_metrics_upload_url(self, request: MetricsUploadUrlRequest) -> SignedUploadUrlResponse:
        storage_path = build_metrics_storage_path(request.recordId)

        return self._build_response(storage_path)

    def request_thumbnail_upload_url(
        self,
        request: ThumbnailUploadUrlRequest,
    ) -> SignedUploadUrlResponse:
        storage_path = build_thumbnail_storage_path(request.recordId)

        return self._build_response(storage_path)

    def complete_video_upload(self, request: VideoUploadCompleteRequest) -> ArtifactCompleteResponse:
        self._validate_storage_path(
            is_video_storage_path_for_record(request.recordId, request.storagePath),
        )

        return self._mark_complete(
            record_id=request.recordId,
            artifact_type="video",
            storage_path=request.storagePath,
        )

    def complete_pose_upload(self, request: PoseUploadCompleteRequest) -> ArtifactCompleteResponse:
        self._validate_storage_path(
            is_pose_storage_path_for_record(request.recordId, request.storagePath),
        )

        return self._mark_complete(
            record_id=request.recordId,
            artifact_type="pose",
            storage_path=request.storagePath,
            version=request.version,
        )

    def complete_metrics_upload(self, request: MetricsUploadCompleteRequest) -> MetricsUploadCompleteResponse:
        self._validate_storage_path(
            is_metrics_storage_path_for_record(request.recordId, request.storagePath),
        )

        self.metric_summary_repository.persist_summary(
            record_id=request.recordId,
            items=[
                MetricSummaryItemRecord(
                    metric_id=item.metricId,
                    min=item.min,
                    max=item.max,
                    average=item.average,
                    range_of_motion=item.rangeOfMotion,
                )
                for item in request.summary
            ],
        )

        record = self._mark_complete(
            record_id=request.recordId,
            artifact_type="metrics",
            storage_path=request.storagePath,
            version=request.version,
        )

        return MetricsUploadCompleteResponse(
            recordId=record.recordId,
            artifactType="metrics",
            storagePath=record.storagePath,
            status=record.status,
            summaryPersisted=True,
        )

    def complete_thumbnail_upload(
        self,
        request: ThumbnailUploadCompleteRequest,
    ) -> ArtifactCompleteResponse:
        self._validate_storage_path(
            is_thumbnail_storage_path_for_record(request.recordId, request.storagePath),
        )

        return self._mark_complete(
            record_id=request.recordId,
            artifact_type="thumbnail",
            storage_path=request.storagePath,
            generated_from_frame_index=request.generatedFromFrameIndex,
        )

    def _build_response(self, storage_path: str) -> SignedUploadUrlResponse:
        return SignedUploadUrlResponse(
            uploadUrl=self.signed_url_service.create_upload_url(storage_path),
            storagePath=storage_path,
            expiresAt=self.signed_url_service.expires_at(),
        )

    def _mark_complete(
        self,
        *,
        record_id: str,
        artifact_type: ArtifactType,
        storage_path: str,
        version: str | None = None,
        generated_from_frame_index: int | None = None,
    ) -> ArtifactCompleteResponse:
        record = self.artifact_repository.mark_complete(
            record_id=record_id,
            artifact_type=artifact_type,
            storage_path=storage_path,
            version=version,
            generated_from_frame_index=generated_from_frame_index,
        )

        return ArtifactCompleteResponse(
            recordId=record.record_id,
            artifactType=record.artifact_type,
            storagePath=record.storage_path,
            status=record.status,
        )

    def _validate_storage_path(self, is_valid: bool) -> None:
        if is_valid:
            return

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STORAGE_PATH",
                "message": "Storage path does not match the requested record and artifact type.",
            },
        )
