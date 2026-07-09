from pydantic import BaseModel, ConfigDict, Field


class CreateAnnotationRequest(BaseModel):
    frameIndex: int = Field(ge=0)
    timestamp: float = Field(ge=0)
    title: str = Field(min_length=1)
    note: str = ""
    jointId: int | None = Field(default=None, ge=0, le=32)


class UpdateAnnotationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    note: str | None = None


class AnnotationResponse(BaseModel):
    annotationId: str
    recordId: str
    frameIndex: int
    timestamp: float
    title: str
    note: str
    jointId: int | None = None
    authorUserId: str
    createdAt: str
    updatedAt: str


class ListAnnotationsResponse(BaseModel):
    items: list[AnnotationResponse] = Field(default_factory=list)
    total: int
