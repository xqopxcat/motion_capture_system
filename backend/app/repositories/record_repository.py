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
    updated_at: datetime
    uploading_at: datetime | None = None
    processing_started_at: datetime | None = None
    ready_at: datetime | None = None
    failed_at: datetime | None = None
    failure_stage: str | None = None
    failure_code: str | None = None
    failure_message: str | None = None
    retryable: bool | None = None
    retry_count: int = 0


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
            updated_at=datetime.now(UTC),
            uploading_at=datetime.now(UTC),
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
            now = datetime.now(UTC)
            record = StoredRecord(
                **{**current.__dict__, "status": status, "updated_at": now,
                   "processing_started_at": now if status == "Processing" else current.processing_started_at,
                   "ready_at": now if status == "Ready" else current.ready_at}
            )

        self._records[record_id] = record

        return CreateRecordResponse(recordId=record.record_id, status=record.status)

    def transition(self, *, record_id: str, expected_statuses: tuple[RecordStatus, ...],
                   status: RecordStatus) -> StoredRecord:
        current = self._records.get(record_id)
        if current is None:
            raise KeyError(record_id)
        if current.status not in expected_statuses:
            raise ValueError(f"Invalid transition: {current.status} -> {status}")
        self.update_status(record_id, status)
        return self._records[record_id]

    def mark_failed(self, *, record_id: str, stage: str, code: str, message: str,
                    retryable: bool) -> StoredRecord:
        current = self._records[record_id]
        now = datetime.now(UTC)
        failed = StoredRecord(**{**current.__dict__, "status": "Failed", "updated_at": now,
                                "failed_at": now, "failure_stage": stage,
                                "failure_code": code, "failure_message": message,
                                "retryable": retryable})
        self._records[record_id] = failed
        return failed

    def retry_failed(self, *, record_id: str) -> StoredRecord:
        current = self._records[record_id]
        if current.status != "Failed" or not current.retryable:
            raise ValueError("Record failure is not retryable.")
        now = datetime.now(UTC)
        retried = StoredRecord(**{**current.__dict__, "status": "Uploading",
                                 "updated_at": now, "uploading_at": now,
                                 "processing_started_at": None, "ready_at": None,
                                 "failed_at": None, "failure_stage": None,
                                 "failure_code": None, "failure_message": None,
                                 "retryable": None, "retry_count": current.retry_count + 1})
        self._records[record_id] = retried
        return retried

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
