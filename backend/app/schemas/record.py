from typing import Literal

from pydantic import BaseModel, Field


RecordStatus = Literal["Uploading", "Processing", "Ready", "Failed"]


class CreateRecordRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str = ""
    tags: list[str] = Field(default_factory=list)


class CreateRecordResponse(BaseModel):
    recordId: str
    status: RecordStatus


class FinalizeRecordResponse(BaseModel):
    recordId: str
    status: Literal["Ready"]


class RecordDetailVideo(BaseModel):
    url: str
    duration: float | None = None
    fps: float | None = None


class RecordDetailPose(BaseModel):
    url: str
    version: str


class RecordDetailMetricSummary(BaseModel):
    metricId: str
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


class RecordListItem(BaseModel):
    recordId: str
    title: str
    description: str
    thumbnailUrl: str | None = None
    duration: float | None = None
    status: RecordStatus
    tags: list[str] = Field(default_factory=list)
    createdAt: str


class ListRecordsResponse(BaseModel):
    items: list[RecordListItem] = Field(default_factory=list)
    total: int
