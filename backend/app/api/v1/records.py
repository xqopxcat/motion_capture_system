from fastapi import APIRouter, status

from app.schemas.record import CreateRecordRequest, CreateRecordResponse, FinalizeRecordResponse
from app.services.record_service import RecordService

router = APIRouter(prefix="/records", tags=["records"])


@router.post("", response_model=CreateRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(request: CreateRecordRequest) -> CreateRecordResponse:
    return RecordService().create_record(request)


@router.post("/{record_id}/complete", response_model=FinalizeRecordResponse)
def finalize_record(record_id: str) -> FinalizeRecordResponse:
    return RecordService().finalize_record(record_id)
