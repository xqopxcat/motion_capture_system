from fastapi import APIRouter, Depends, status

from app.api.deps import current_user
from app.schemas.annotation import (
    AnnotationResponse,
    CreateAnnotationRequest,
    ListAnnotationsResponse,
)
from app.schemas.auth import CurrentUser
from app.services.annotation_service import AnnotationService

router = APIRouter(prefix="/records/{record_id}/annotations", tags=["annotations"])


@router.get("", response_model=ListAnnotationsResponse)
def list_annotations(
    record_id: str,
    user: CurrentUser = Depends(current_user),
) -> ListAnnotationsResponse:
    return AnnotationService().list_annotations(record_id, user)


@router.post("", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
def create_annotation(
    record_id: str,
    request: CreateAnnotationRequest,
    user: CurrentUser = Depends(current_user),
) -> AnnotationResponse:
    return AnnotationService().create_annotation(record_id, request, user)
