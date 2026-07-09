from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.annotation import CreateAnnotationRequest, UpdateAnnotationRequest


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

    def get(self, annotation_id: str) -> StoredAnnotation | None:
        return self._annotations.get(annotation_id)

    def update(self, annotation_id: str, request: UpdateAnnotationRequest) -> StoredAnnotation:
        current = self._annotations.get(annotation_id)
        if current is None:
            raise KeyError(f"Annotation does not exist: {annotation_id}")

        annotation = StoredAnnotation(
            annotation_id=current.annotation_id,
            record_id=current.record_id,
            frame_index=current.frame_index,
            timestamp=current.timestamp,
            title=request.title.strip() if request.title is not None else current.title,
            note=request.note if request.note is not None else current.note,
            author_user_id=current.author_user_id,
            created_at=current.created_at,
            updated_at=datetime.now(UTC),
        )
        self._annotations[annotation.annotation_id] = annotation

        return annotation

    def delete(self, annotation_id: str) -> None:
        if annotation_id not in self._annotations:
            raise KeyError(f"Annotation does not exist: {annotation_id}")

        del self._annotations[annotation_id]
