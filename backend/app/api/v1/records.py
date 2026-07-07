from fastapi import APIRouter, status

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
def create_record(request: CreateRecordRequest) -> CreateRecordResponse:
    return RecordService().create_record(request)


@router.get("", response_model=ListRecordsResponse)
def list_records() -> ListRecordsResponse:
    return RecordService().list_records()


@router.post("/{record_id}/complete", response_model=FinalizeRecordResponse)
def finalize_record(record_id: str) -> FinalizeRecordResponse:
    return RecordService().finalize_record(record_id)


@router.get("/{record_id}", response_model=RecordDetailResponse)
def get_record_detail(record_id: str) -> RecordDetailResponse:
    return RecordService().get_record_detail(record_id)
