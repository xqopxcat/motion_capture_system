from uuid import uuid4

from app.schemas.record import CreateRecordRequest, CreateRecordResponse


class RecordRepository:
    def create(self, request: CreateRecordRequest) -> CreateRecordResponse:
        _ = request

        return CreateRecordResponse(
            recordId=f"record_{uuid4().hex}",
            status="Uploading",
        )
