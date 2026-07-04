from fastapi import APIRouter

from app.schemas.upload import (
    MetricsUploadUrlRequest,
    PoseUploadUrlRequest,
    SignedUploadUrlResponse,
    ThumbnailUploadUrlRequest,
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
