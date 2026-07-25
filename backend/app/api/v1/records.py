from fastapi import APIRouter, Depends, Response, status

from app.api.deps import current_user, get_record_service
from app.schemas.auth import CurrentUser
from app.schemas.record import (
    CreateRecordRequest,
    CreateRecordResponse,
    FinalizeRecordResponse,
    RetryRecordResponse,
    DeleteRecordResponse,
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


@router.post(
    "/{record_id}/complete",
    response_model=FinalizeRecordResponse,
    response_model_exclude_none=True,
)
def finalize_record(
    record_id: str,
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> FinalizeRecordResponse:
    return service.finalize_record(record_id, user)


@router.post("/{record_id}/retry", response_model=RetryRecordResponse)
def retry_record(
    record_id: str,
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> RetryRecordResponse:
    return service.retry_record(record_id, user)


@router.delete(
    "/{record_id}",
    response_model=DeleteRecordResponse,
    response_model_exclude_none=True,
)
def delete_record(
    record_id: str,
    response: Response,
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> DeleteRecordResponse:
    result = service.delete_record(record_id, user)
    if result.status == "CleanupFailed":
        response.status_code = status.HTTP_502_BAD_GATEWAY
    return result


@router.get("/{record_id}", response_model=RecordDetailResponse)
def get_record_detail(
    record_id: str,
    user: CurrentUser = Depends(current_user),
    service: RecordService = Depends(get_record_service),
) -> RecordDetailResponse:
    return service.get_record_detail(record_id, user)
