from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.record import CreateRecordRequest, CreateRecordResponse, RecordStatus


@dataclass(frozen=True)
class StoredRecord:
    record_id: str
    owner_user_id: str
    title: str
    description: str
    tags: tuple[str, ...]
    status: RecordStatus
    created_at: datetime


class RecordRepository:
    def __init__(self) -> None:
        self._records: dict[str, StoredRecord] = {}

    def create(self, request: CreateRecordRequest, *, owner_user_id: str) -> CreateRecordResponse:
        record = StoredRecord(
            record_id=f"record_{uuid4().hex}",
            owner_user_id=owner_user_id,
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

    def is_owned_by(self, record_id: str, owner_user_id: str) -> bool:
        record = self._records.get(record_id)
        return record is not None and record.owner_user_id == owner_user_id

    def update_status(self, record_id: str, status: RecordStatus) -> CreateRecordResponse:
        current = self._records.get(record_id)
        if current is None:
            raise KeyError(f"Record does not exist: {record_id}")
        else:
            record = StoredRecord(
                record_id=current.record_id,
                owner_user_id=current.owner_user_id,
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

    def get_owned(self, record_id: str, owner_user_id: str) -> StoredRecord | None:
        record = self._records.get(record_id)
        if record is None or record.owner_user_id != owner_user_id:
            return None

        return record

    def list(self) -> list[StoredRecord]:
        return sorted(
            self._records.values(),
            key=lambda record: record.created_at,
            reverse=True,
        )

    def list_owned(self, owner_user_id: str) -> list[StoredRecord]:
        return sorted(
            [
                record
                for record in self._records.values()
                if record.owner_user_id == owner_user_id
            ],
            key=lambda record: record.created_at,
            reverse=True,
        )

    def delete_owned(self, record_id: str, owner_user_id: str) -> bool:
        if not self.is_owned_by(record_id, owner_user_id):
            return False
        del self._records[record_id]
        return True
