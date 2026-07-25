from typing import Literal

from pydantic import BaseModel, Field


RecordStatus = Literal["Uploading", "Processing", "Ready", "Failed"]


class CreateRecordRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str = ""
    tags: list[str] = Field(default_factory=list)
    duration: float | None = Field(default=None, gt=0)
    fps: float | None = Field(default=None, gt=0)


class CreateRecordResponse(BaseModel):
    recordId: str
    status: RecordStatus


class FinalizeRecordResponse(BaseModel):
    recordId: str
    status: Literal["Processing", "Ready", "Failed"]
    failureCode: str | None = None
    failureMessage: str | None = None
    retryable: bool | None = None


class RetryRecordResponse(BaseModel):
    recordId: str
    status: Literal["Uploading"]
    retryCount: int


class DeleteRecordResponse(BaseModel):
    recordId: str
    status: Literal["Deleted", "CleanupFailed"]
    deletedArtifacts: int
    failureCode: str | None = None
    failureMessage: str | None = None
    retryable: bool | None = None


class RecordDetailVideo(BaseModel):
    url: str
    duration: float | None = None
    fps: float | None = None


class RecordDetailPose(BaseModel):
    url: str
    version: str


class RecordDetailMetricSummary(BaseModel):
    metricId: str
    unit: str | None = None
    metricDefinitionVersion: str | None = None
    activityType: str | None = None
    side: str | None = None
    min: float
    max: float
    average: float
    rangeOfMotion: float


class RecordDetailMetrics(BaseModel):
    seriesUrl: str | None = None
    summary: list[RecordDetailMetricSummary] = Field(default_factory=list)


class RecordDetailResponse(BaseModel):
    recordId: str
    title: str
    description: str
    status: RecordStatus
    video: RecordDetailVideo | None = None
    pose: RecordDetailPose | None = None
    metrics: RecordDetailMetrics | None = None
    tags: list[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str | None = None
    uploadingAt: str | None = None
    processingStartedAt: str | None = None
    readyAt: str | None = None
    failedAt: str | None = None
    failureStage: str | None = None
    failureCode: str | None = None
    failureMessage: str | None = None
    retryable: bool | None = None
    retryCount: int = 0


class RecordListItem(BaseModel):
    recordId: str
    title: str
    description: str
    thumbnailUrl: str | None = None
    duration: float | None = None
    status: RecordStatus
    tags: list[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str | None = None
    failureCode: str | None = None
    failureMessage: str | None = None
    retryable: bool | None = None


class ListRecordsResponse(BaseModel):
    items: list[RecordListItem] = Field(default_factory=list)
    total: int
