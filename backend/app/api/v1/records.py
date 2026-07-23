from fastapi import APIRouter, Depends, status

from app.api.deps import current_user, get_record_service
from app.schemas.auth import CurrentUser
from app.schemas.record import (
    CreateRecordRequest,
    CreateRecordResponse,
    FinalizeRecordResponse,
    ListRecordsResponse,
    RecordDetailResponse,
)
from app.services.record_service import RecordService

router = APIRouter(prefix="/records", tags=["records"])


@router.post("", response_model=CreateRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    request: CreateRecordRequest,
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> CreateRecordResponse:
    return service.create_record(request, user)


@router.get("", response_model=ListRecordsResponse)
def list_records(
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> ListRecordsResponse:
    return service.list_records(user)


@router.post("/{record_id}/complete", response_model=FinalizeRecordResponse)
def finalize_record(
    record_id: str,
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> FinalizeRecordResponse:
    return service.finalize_record(record_id, user)


@router.get("/{record_id}", response_model=RecordDetailResponse)
def get_record_detail(
    record_id: str,
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> RecordDetailResponse:
    return service.get_record_detail(record_id, user)
