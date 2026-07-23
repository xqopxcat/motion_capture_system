from fastapi import APIRouter, Depends

from app.api.deps import current_user, get_upload_service
from app.schemas.auth import CurrentUser
from app.schemas.upload import (
    ArtifactCompleteResponse,
    MetricsUploadCompleteRequest,
    MetricsUploadCompleteResponse,
    MetricsUploadUrlRequest,
    PoseUploadCompleteRequest,
    PoseUploadUrlRequest,
    ThumbnailUploadCompleteRequest,
    SignedUploadUrlResponse,
    ThumbnailUploadUrlRequest,
    VideoUploadCompleteRequest,
    VideoUploadUrlRequest,
)
from app.services.upload_service import UploadService

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/video", response_model=SignedUploadUrlResponse)
def request_video_upload_url(
    request: VideoUploadUrlRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> SignedUploadUrlResponse:
    return service.request_video_upload_url(request, user)


@router.post("/pose", response_model=SignedUploadUrlResponse)
def request_pose_upload_url(
    request: PoseUploadUrlRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> SignedUploadUrlResponse:
    return service.request_pose_upload_url(request, user)


@router.post("/metrics", response_model=SignedUploadUrlResponse)
def request_metrics_upload_url(
    request: MetricsUploadUrlRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> SignedUploadUrlResponse:
    return service.request_metrics_upload_url(request, user)


@router.post("/thumbnail", response_model=SignedUploadUrlResponse)
def request_thumbnail_upload_url(
    request: ThumbnailUploadUrlRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> SignedUploadUrlResponse:
    return service.request_thumbnail_upload_url(request, user)


@router.post("/video/complete", response_model=ArtifactCompleteResponse)
def complete_video_upload(
    request: VideoUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> ArtifactCompleteResponse:
    return service.complete_video_upload(request, user)


@router.post("/pose/complete", response_model=ArtifactCompleteResponse)
def complete_pose_upload(
    request: PoseUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> ArtifactCompleteResponse:
    return service.complete_pose_upload(request, user)


@router.post("/metrics/complete", response_model=MetricsUploadCompleteResponse)
def complete_metrics_upload(
    request: MetricsUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> MetricsUploadCompleteResponse:
    return service.complete_metrics_upload(request, user)


@router.post("/thumbnail/complete", response_model=ArtifactCompleteResponse)
def complete_thumbnail_upload(
    request: ThumbnailUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
    service: UploadService = Depends(get_upload_service),
) -> ArtifactCompleteResponse:
    return service.complete_thumbnail_upload(request, user)
