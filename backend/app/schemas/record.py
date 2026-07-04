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
