from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.annotation import CreateAnnotationRequest


@dataclass(frozen=True)
class StoredAnnotation:
    annotation_id: str
    record_id: str
    frame_index: int
    timestamp: float
    title: str
    note: str
    author_user_id: str
    created_at: datetime
    updated_at: datetime


class AnnotationRepository:
    def __init__(self) -> None:
        self._annotations: dict[str, StoredAnnotation] = {}

    def create(
        self,
        record_id: str,
        request: CreateAnnotationRequest,
        *,
        author_user_id: str,
    ) -> StoredAnnotation:
        now = datetime.now(UTC)
        annotation = StoredAnnotation(
            annotation_id=f"annotation_{uuid4().hex}",
            record_id=record_id,
            frame_index=request.frameIndex,
            timestamp=request.timestamp,
            title=request.title.strip(),
            note=request.note,
            author_user_id=author_user_id,
            created_at=now,
            updated_at=now,
        )
        self._annotations[annotation.annotation_id] = annotation

        return annotation

    def list_for_record(self, record_id: str) -> list[StoredAnnotation]:
        return sorted(
            [
                annotation
                for annotation in self._annotations.values()
                if annotation.record_id == record_id
            ],
            key=lambda annotation: (annotation.frame_index, annotation.created_at),
        )
