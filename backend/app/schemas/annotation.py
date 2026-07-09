from pydantic import BaseModel, ConfigDict, Field


class CreateAnnotationRequest(BaseModel):
    frameIndex: int = Field(ge=0)
    timestamp: float = Field(ge=0)
    title: str = Field(min_length=1)
    note: str = ""


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
    authorUserId: str
    createdAt: str
    updatedAt: str


class ListAnnotationsResponse(BaseModel):
    items: list[AnnotationResponse] = Field(default_factory=list)
    total: int
