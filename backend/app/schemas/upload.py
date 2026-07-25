from datetime import datetime
from math import isfinite
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

SHA256_PATTERN = r"^[0-9a-f]{64}$"


class UploadIntegrity(BaseModel):
    checksumAlgorithm: Literal["sha256"] = "sha256"
    checksum: str = Field(default="0" * 64, pattern=SHA256_PATTERN)


class VideoUploadUrlRequest(UploadIntegrity):
    recordId: str = Field(min_length=1)
    fileName: str = Field(min_length=1)
    contentType: str = Field(min_length=1)
    fileSize: int = Field(default=1, gt=0)


class PoseUploadUrlRequest(UploadIntegrity):
    recordId: str = Field(min_length=1)
    contentType: str = Field(min_length=1)
    fileSize: int = Field(default=1, gt=0)


class MetricsUploadUrlRequest(UploadIntegrity):
    recordId: str = Field(min_length=1)
    contentType: str = Field(min_length=1)
    fileSize: int = Field(default=1, gt=0)


class ThumbnailUploadUrlRequest(UploadIntegrity):
    recordId: str = Field(min_length=1)
    contentType: str = Field(min_length=1)
    fileSize: int = Field(gt=0)
    generatedFromFrameIndex: int = Field(ge=0)


class SignedUploadUrlResponse(BaseModel):
    uploadUrl: str
    storagePath: str
    expiresAt: datetime


class UploadCompleteIntegrity(BaseModel):
    fileSize: int = Field(default=1, gt=0)
    checksumAlgorithm: Literal["sha256"] = "sha256"
    checksum: str = Field(default="0" * 64, pattern=SHA256_PATTERN)
    objectGeneration: str | None = Field(default=None, min_length=1)


class VideoUploadCompleteRequest(UploadCompleteIntegrity):
    recordId: str = Field(min_length=1)
    storagePath: str = Field(min_length=1)


class PoseUploadCompleteRequest(UploadCompleteIntegrity):
    recordId: str = Field(min_length=1)
    storagePath: str = Field(min_length=1)
    version: str = Field(min_length=1)


class MetricSummary(BaseModel):
    metricId: str = Field(min_length=1)
    unit: str | None = Field(default=None, min_length=1)
    metricDefinitionVersion: str | None = Field(default=None, min_length=1)
    activityType: str | None = Field(default=None, min_length=1)
    side: str | None = Field(default=None, min_length=1)
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


class MetricsUploadCompleteRequest(UploadCompleteIntegrity):
    recordId: str = Field(min_length=1)
    storagePath: str = Field(min_length=1)
    version: str = Field(min_length=1)
    summary: list[MetricSummary] = Field(min_length=1)


class ThumbnailUploadCompleteRequest(UploadCompleteIntegrity):
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
