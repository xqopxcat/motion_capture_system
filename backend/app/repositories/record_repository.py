from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.record import CreateRecordRequest, CreateRecordResponse, RecordStatus


@dataclass(frozen=True)
class StoredRecord:
    record_id: str
    title: str
    description: str
    tags: tuple[str, ...]
    status: RecordStatus
    created_at: datetime


class RecordRepository:
    def __init__(self) -> None:
        self._records: dict[str, StoredRecord] = {}

    def create(self, request: CreateRecordRequest) -> CreateRecordResponse:
        record = StoredRecord(
            record_id=f"record_{uuid4().hex}",
            title=request.title,
            description=request.description,
            tags=tuple(request.tags),
            status="Uploading",
            created_at=datetime.now(UTC),
        )
        self._records[record.record_id] = record

        return CreateRecordResponse(recordId=record.record_id, status=record.status)

    def exists(self, record_id: str) -> bool:
        return record_id in self._records

    def update_status(self, record_id: str, status: RecordStatus) -> CreateRecordResponse:
        current = self._records.get(record_id)
        if current is None:
            record = StoredRecord(
                record_id=record_id,
                title="",
                description="",
                tags=(),
                status=status,
                created_at=datetime.now(UTC),
            )
        else:
            record = StoredRecord(
                record_id=current.record_id,
                title=current.title,
                description=current.description,
                tags=current.tags,
                status=status,
                created_at=current.created_at,
            )

        self._records[record_id] = record

        return CreateRecordResponse(recordId=record.record_id, status=record.status)

    def get(self, record_id: str) -> StoredRecord | None:
        return self._records.get(record_id)

    def list(self) -> list[StoredRecord]:
        return sorted(
            self._records.values(),
            key=lambda record: record.created_at,
            reverse=True,
        )
