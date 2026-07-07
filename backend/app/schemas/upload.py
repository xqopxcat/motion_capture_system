from datetime import datetime
from math import isfinite
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


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


class VideoUploadCompleteRequest(BaseModel):
    recordId: str = Field(min_length=1)
    storagePath: str = Field(min_length=1)


class PoseUploadCompleteRequest(BaseModel):
    recordId: str = Field(min_length=1)
    storagePath: str = Field(min_length=1)
    version: str = Field(min_length=1)


class MetricSummary(BaseModel):
    metricId: str = Field(min_length=1)
    min: float
    max: float
    average: float
    rangeOfMotion: float = Field(ge=0)

    @field_validator("min", "max", "average", "rangeOfMotion")
    @classmethod
    def validate_finite_number(cls, value: float) -> float:
        if not isfinite(value):
            raise ValueError("Metric summary values must be finite numbers.")

        return value

    @model_validator(mode="after")
    def validate_range(self) -> "MetricSummary":
        if self.max < self.min:
            raise ValueError("Metric summary max must be greater than or equal to min.")

        return self


class MetricsUploadCompleteRequest(BaseModel):
    recordId: str = Field(min_length=1)
    storagePath: str = Field(min_length=1)
    version: str = Field(min_length=1)
    summary: list[MetricSummary] = Field(min_length=1)


class ThumbnailUploadCompleteRequest(BaseModel):
    recordId: str = Field(min_length=1)
    storagePath: str = Field(min_length=1)
    generatedFromFrameIndex: int = Field(ge=0)


class ArtifactCompleteResponse(BaseModel):
    recordId: str
    artifactType: Literal["video", "pose", "metrics", "thumbnail"]
    storagePath: str
    status: Literal["Complete"]


class MetricsUploadCompleteResponse(ArtifactCompleteResponse):
    artifactType: Literal["metrics"]
    summaryPersisted: bool
