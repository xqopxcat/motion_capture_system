from fastapi import APIRouter, Depends

from app.api.deps import current_user
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
) -> SignedUploadUrlResponse:
    return UploadService().request_video_upload_url(request, user)


@router.post("/pose", response_model=SignedUploadUrlResponse)
def request_pose_upload_url(
    request: PoseUploadUrlRequest,
    user: CurrentUser = Depends(current_user),
) -> SignedUploadUrlResponse:
    return UploadService().request_pose_upload_url(request, user)


@router.post("/metrics", response_model=SignedUploadUrlResponse)
def request_metrics_upload_url(
    request: MetricsUploadUrlRequest,
    user: CurrentUser = Depends(current_user),
) -> SignedUploadUrlResponse:
    return UploadService().request_metrics_upload_url(request, user)


@router.post("/thumbnail", response_model=SignedUploadUrlResponse)
def request_thumbnail_upload_url(
    request: ThumbnailUploadUrlRequest,
    user: CurrentUser = Depends(current_user),
) -> SignedUploadUrlResponse:
    return UploadService().request_thumbnail_upload_url(request, user)


@router.post("/video/complete", response_model=ArtifactCompleteResponse)
def complete_video_upload(
    request: VideoUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
) -> ArtifactCompleteResponse:
    return UploadService().complete_video_upload(request, user)


@router.post("/pose/complete", response_model=ArtifactCompleteResponse)
def complete_pose_upload(
    request: PoseUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
) -> ArtifactCompleteResponse:
    return UploadService().complete_pose_upload(request, user)


@router.post("/metrics/complete", response_model=MetricsUploadCompleteResponse)
def complete_metrics_upload(
    request: MetricsUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
) -> MetricsUploadCompleteResponse:
    return UploadService().complete_metrics_upload(request, user)


@router.post("/thumbnail/complete", response_model=ArtifactCompleteResponse)
def complete_thumbnail_upload(
    request: ThumbnailUploadCompleteRequest,
    user: CurrentUser = Depends(current_user),
) -> ArtifactCompleteResponse:
    return UploadService().complete_thumbnail_upload(request, user)
