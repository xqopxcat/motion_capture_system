from fastapi import APIRouter

from app.schemas.upload import (
    ArtifactCompleteResponse,
    MetricsUploadCompleteRequest,
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
def request_video_upload_url(request: VideoUploadUrlRequest) -> SignedUploadUrlResponse:
    return UploadService().request_video_upload_url(request)


@router.post("/pose", response_model=SignedUploadUrlResponse)
def request_pose_upload_url(request: PoseUploadUrlRequest) -> SignedUploadUrlResponse:
    return UploadService().request_pose_upload_url(request)


@router.post("/metrics", response_model=SignedUploadUrlResponse)
def request_metrics_upload_url(request: MetricsUploadUrlRequest) -> SignedUploadUrlResponse:
    return UploadService().request_metrics_upload_url(request)


@router.post("/thumbnail", response_model=SignedUploadUrlResponse)
def request_thumbnail_upload_url(request: ThumbnailUploadUrlRequest) -> SignedUploadUrlResponse:
    return UploadService().request_thumbnail_upload_url(request)


@router.post("/video/complete", response_model=ArtifactCompleteResponse)
def complete_video_upload(request: VideoUploadCompleteRequest) -> ArtifactCompleteResponse:
    return UploadService().complete_video_upload(request)


@router.post("/pose/complete", response_model=ArtifactCompleteResponse)
def complete_pose_upload(request: PoseUploadCompleteRequest) -> ArtifactCompleteResponse:
    return UploadService().complete_pose_upload(request)


@router.post("/metrics/complete", response_model=ArtifactCompleteResponse)
def complete_metrics_upload(request: MetricsUploadCompleteRequest) -> ArtifactCompleteResponse:
    return UploadService().complete_metrics_upload(request)


@router.post("/thumbnail/complete", response_model=ArtifactCompleteResponse)
def complete_thumbnail_upload(request: ThumbnailUploadCompleteRequest) -> ArtifactCompleteResponse:
    return UploadService().complete_thumbnail_upload(request)
