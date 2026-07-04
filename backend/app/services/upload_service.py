from app.schemas.upload import (
    MetricsUploadUrlRequest,
    PoseUploadUrlRequest,
    SignedUploadUrlResponse,
    ThumbnailUploadUrlRequest,
    VideoUploadUrlRequest,
)
from app.storage.signed_url_service import SignedUrlService
from app.storage.storage_paths import (
    build_metrics_storage_path,
    build_pose_storage_path,
    build_thumbnail_storage_path,
    build_video_storage_path,
)


class UploadService:
    def __init__(self, signed_url_service: SignedUrlService | None = None) -> None:
        self.signed_url_service = signed_url_service or SignedUrlService()

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

    def _build_response(self, storage_path: str) -> SignedUploadUrlResponse:
        return SignedUploadUrlResponse(
            uploadUrl=self.signed_url_service.create_upload_url(storage_path),
            storagePath=storage_path,
            expiresAt=self.signed_url_service.expires_at(),
        )
