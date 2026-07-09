from fastapi import HTTPException, status

from app.repositories.annotation_repository import AnnotationRepository, StoredAnnotation
from app.repositories.record_repository import RecordRepository
from app.repositories.runtime_repositories import annotation_repository, record_repository
from app.schemas.annotation import (
    AnnotationResponse,
    CreateAnnotationRequest,
    ListAnnotationsResponse,
    UpdateAnnotationRequest,
)
from app.schemas.auth import CurrentUser


class AnnotationService:
    def __init__(
        self,
        annotations: AnnotationRepository | None = None,
        records: RecordRepository | None = None,
    ) -> None:
        self.annotations = annotations or annotation_repository
        self.records = records or record_repository

    def list_annotations(self, record_id: str, user: CurrentUser) -> ListAnnotationsResponse:
        self._require_owned_record(record_id, user)
        items = [
            self._to_response(annotation)
            for annotation in self.annotations.list_for_record(record_id)
        ]

        return ListAnnotationsResponse(items=items, total=len(items))

    def create_annotation(
        self,
        record_id: str,
        request: CreateAnnotationRequest,
        user: CurrentUser,
    ) -> AnnotationResponse:
        self._require_owned_record(record_id, user)

        if not request.title.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "ANNOTATION_TITLE_REQUIRED",
                    "message": "Annotation title is required.",
                },
            )

        annotation = self.annotations.create(
            record_id,
            request,
            author_user_id=user.userId,
        )

        return self._to_response(annotation)

    def update_annotation(
        self,
        record_id: str,
        annotation_id: str,
        request: UpdateAnnotationRequest,
        user: CurrentUser,
    ) -> AnnotationResponse:
        self._require_owned_record(record_id, user)
        annotation = self._require_record_annotation(record_id, annotation_id)

        if request.title is not None and not request.title.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "ANNOTATION_TITLE_REQUIRED",
                    "message": "Annotation title is required.",
                },
            )

        updated_annotation = self.annotations.update(annotation.annotation_id, request)

        return self._to_response(updated_annotation)

    def delete_annotation(
        self,
        record_id: str,
        annotation_id: str,
        user: CurrentUser,
    ) -> None:
        self._require_owned_record(record_id, user)
        annotation = self._require_record_annotation(record_id, annotation_id)
        self.annotations.delete(annotation.annotation_id)

    def _require_owned_record(self, record_id: str, user: CurrentUser) -> None:
        record = self.records.get_owned(record_id, user.userId)
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "RECORD_NOT_FOUND",
                    "message": "Record does not exist.",
                },
            )

    def _require_record_annotation(
        self,
        record_id: str,
        annotation_id: str,
    ) -> StoredAnnotation:
        annotation = self.annotations.get(annotation_id)
        if annotation is None or annotation.record_id != record_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "ANNOTATION_NOT_FOUND",
                    "message": "Annotation does not exist.",
                },
            )

        return annotation

    def _to_response(self, annotation: StoredAnnotation) -> AnnotationResponse:
        return AnnotationResponse(
            annotationId=annotation.annotation_id,
            recordId=annotation.record_id,
            frameIndex=annotation.frame_index,
            timestamp=annotation.timestamp,
            title=annotation.title,
            note=annotation.note,
            jointId=annotation.joint_id,
            authorUserId=annotation.author_user_id,
            createdAt=annotation.created_at.isoformat(),
            updatedAt=annotation.updated_at.isoformat(),
        )
