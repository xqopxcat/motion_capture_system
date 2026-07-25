from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

ArtifactType = Literal["video", "pose", "metrics", "thumbnail"]
ArtifactStatus = Literal["Complete"]


@dataclass(frozen=True)
class ArtifactCompletionRecord:
    record_id: str
    artifact_type: ArtifactType
    storage_path: str
    status: ArtifactStatus
    completed_at: datetime
    version: str | None = None
    generated_from_frame_index: int | None = None
    content_type: str = ""
    expected_file_size: int = 0
    validated_file_size: int | None = None
    checksum_algorithm: str | None = None
    expected_checksum: str | None = None
    validated_checksum: str | None = None
    integrity_state: str = "Pending"
    upload_state: str = "Pending"
    object_generation: str | None = None


class ArtifactRepository:
    def __init__(self) -> None:
        self._artifacts: list[ArtifactCompletionRecord] = []

    def prepare_upload(self, **values) -> ArtifactCompletionRecord:
        existing = self.get(record_id=values["record_id"], artifact_type=values["artifact_type"])
        if existing and existing.upload_state == "Complete":
            raise ValueError("Artifact is already complete.")
        if existing:
            self._artifacts.remove(existing)
        item = ArtifactCompletionRecord(
            record_id=values["record_id"], artifact_type=values["artifact_type"],
            storage_path=values["storage_path"], status="Complete", completed_at=datetime.now(UTC),
            content_type=values["content_type"], expected_file_size=values["expected_file_size"],
            checksum_algorithm=values["checksum_algorithm"], expected_checksum=values["expected_checksum"],
        )
        self._artifacts.append(item)
        return item

    def get(self, *, record_id: str, artifact_type: ArtifactType) -> ArtifactCompletionRecord | None:
        return next((x for x in reversed(self._artifacts)
                     if x.record_id == record_id and x.artifact_type == artifact_type), None)

    def mark_complete(self, *, record_id: str, artifact_type: ArtifactType, storage_path: str,
                      version: str | None = None, generated_from_frame_index: int | None = None,
                      validated_file_size: int | None = None, validated_checksum: str | None = None,
                      object_generation: str | None = None) -> ArtifactCompletionRecord:
        pending = self.get(record_id=record_id, artifact_type=artifact_type)
        if pending and pending.upload_state == "Complete":
            return pending
        if pending:
            self._artifacts.remove(pending)
        item = ArtifactCompletionRecord(
            record_id=record_id, artifact_type=artifact_type, storage_path=storage_path,
            status="Complete", completed_at=datetime.now(UTC), version=version,
            generated_from_frame_index=generated_from_frame_index,
            content_type=pending.content_type if pending else "",
            expected_file_size=pending.expected_file_size if pending else (validated_file_size or 0),
            validated_file_size=validated_file_size,
            checksum_algorithm=pending.checksum_algorithm if pending else "sha256",
            expected_checksum=pending.expected_checksum if pending else validated_checksum,
            validated_checksum=validated_checksum, integrity_state="Verified", upload_state="Complete",
            object_generation=object_generation,
        )
        self._artifacts.append(item)
        return item

    def has_completed(self, *, record_id: str, artifact_type: ArtifactType) -> bool:
        item = self.get(record_id=record_id, artifact_type=artifact_type)
        return bool(item and item.upload_state == "Complete")

    def get_completed(self, *, record_id: str, artifact_type: ArtifactType) -> ArtifactCompletionRecord | None:
        item = self.get(record_id=record_id, artifact_type=artifact_type)
        return item if item and item.upload_state == "Complete" else None

    def get_completed_owned(self, *, record_id: str, artifact_type: ArtifactType,
                            owner_user_id: str) -> ArtifactCompletionRecord | None:
        return self.get_completed(record_id=record_id, artifact_type=artifact_type)

    def get_completed_for_records(self, record_ids: list[str], artifact_type: ArtifactType):
        return {x.record_id: x for x in self._artifacts
                if x.record_id in record_ids and x.artifact_type == artifact_type
                and x.upload_state == "Complete"}

    def list_for_record(self, record_id: str) -> list[ArtifactCompletionRecord]:
        return [x for x in self._artifacts if x.record_id == record_id]
