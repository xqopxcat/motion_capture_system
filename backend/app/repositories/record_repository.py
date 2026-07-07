from uuid import uuid4

from app.schemas.record import CreateRecordRequest, CreateRecordResponse, RecordStatus


class RecordRepository:
    def __init__(self) -> None:
        self._records: dict[str, CreateRecordResponse] = {}

    def create(self, request: CreateRecordRequest) -> CreateRecordResponse:
        _ = request

        record = CreateRecordResponse(
            recordId=f"record_{uuid4().hex}",
            status="Uploading",
        )
        self._records[record.recordId] = record

        return record

    def exists(self, record_id: str) -> bool:
        return record_id in self._records

    def update_status(self, record_id: str, status: RecordStatus) -> CreateRecordResponse:
        record = CreateRecordResponse(recordId=record_id, status=status)
        self._records[record_id] = record

        return record
