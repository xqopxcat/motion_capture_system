from datetime import datetime

from pydantic import BaseModel, Field


class VideoUploadUrlRequest(BaseModel):
    recordId: str = Field(min_length=1)
    fileName: str = Field(min_length=1)
    contentType: str = Field(min_length=1)
    fileSize: int = Field(gt=0)


class PoseUploadUrlRequest(BaseModel):
    recordId: str = Field(min_length=1)
    contentType: str = Field(min_length=1)


class MetricsUploadUrlRequest(BaseModel):
    recordId: str = Field(min_length=1)
    contentType: str = Field(min_length=1)


class ThumbnailUploadUrlRequest(BaseModel):
    recordId: str = Field(min_length=1)
    contentType: str = Field(min_length=1)
    fileSize: int = Field(gt=0)
    generatedFromFrameIndex: int = Field(ge=0)


class SignedUploadUrlResponse(BaseModel):
    uploadUrl: str
    storagePath: str
    expiresAt: datetime
