from app.repositories.record_repository import RecordRepository
from app.schemas.record import CreateRecordRequest, CreateRecordResponse


class RecordService:
    def __init__(self, repository: RecordRepository | None = None) -> None:
        self.repository = repository or RecordRepository()

    def create_record(self, request: CreateRecordRequest) -> CreateRecordResponse:
        return self.repository.create(request)
