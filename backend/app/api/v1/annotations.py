from fastapi import APIRouter, Depends, status

from app.api.deps import current_user, get_annotation_service
from app.schemas.annotation import (
    AnnotationResponse,
    CreateAnnotationRequest,
    ListAnnotationsResponse,
    UpdateAnnotationRequest,
)
from app.schemas.auth import CurrentUser
from app.services.annotation_service import AnnotationService

router = APIRouter(prefix="/records/{record_id}/annotations", tags=["annotations"])


@router.get("", response_model=ListAnnotationsResponse)
def list_annotations(
    record_id: str,
    user: CurrentUser = Depends(current_user),
    service: AnnotationService = Depends(get_annotation_service),
) -> ListAnnotationsResponse:
    return service.list_annotations(record_id, user)


@router.post("", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
def create_annotation(
    record_id: str,
    request: CreateAnnotationRequest,
    user: CurrentUser = Depends(current_user),
    service: AnnotationService = Depends(get_annotation_service),
) -> AnnotationResponse:
    return service.create_annotation(record_id, request, user)


@router.patch("/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(
    record_id: str,
    annotation_id: str,
    request: UpdateAnnotationRequest,
    user: CurrentUser = Depends(current_user),
    service: AnnotationService = Depends(get_annotation_service),
) -> AnnotationResponse:
    return service.update_annotation(record_id, annotation_id, request, user)


@router.delete("/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annotation(
    record_id: str,
    annotation_id: str,
    user: CurrentUser = Depends(current_user),
    service: AnnotationService = Depends(get_annotation_service),
) -> None:
    service.delete_annotation(record_id, annotation_id, user)
