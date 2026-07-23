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


class ArtifactRepository:
    def __init__(self) -> None:
        self._completed_artifacts: list[ArtifactCompletionRecord] = []

    def mark_complete(
        self,
        *,
        record_id: str,
        artifact_type: ArtifactType,
        storage_path: str,
        version: str | None = None,
        generated_from_frame_index: int | None = None,
    ) -> ArtifactCompletionRecord:
        record = ArtifactCompletionRecord(
            record_id=record_id,
            artifact_type=artifact_type,
            storage_path=storage_path,
            status="Complete",
            completed_at=datetime.now(UTC),
            version=version,
            generated_from_frame_index=generated_from_frame_index,
        )
        self._completed_artifacts.append(record)

        return record

    def has_completed(self, *, record_id: str, artifact_type: ArtifactType) -> bool:
        return any(
            record.record_id == record_id
            and record.artifact_type == artifact_type
            and record.status == "Complete"
            for record in self._completed_artifacts
        )

    def get_completed(
        self,
        *,
        record_id: str,
        artifact_type: ArtifactType,
    ) -> ArtifactCompletionRecord | None:
        for record in reversed(self._completed_artifacts):
            if (
                record.record_id == record_id
                and record.artifact_type == artifact_type
                and record.status == "Complete"
            ):
                return record

        return None

    def get_completed_owned(
        self,
        *,
        record_id: str,
        artifact_type: ArtifactType,
        owner_user_id: str,
    ) -> ArtifactCompletionRecord | None:
        return self.get_completed(record_id=record_id, artifact_type=artifact_type)

    def get_completed_for_records(
        self,
        record_ids: list[str],
        artifact_type: ArtifactType,
    ) -> dict[str, ArtifactCompletionRecord]:
        requested = set(record_ids)
        result: dict[str, ArtifactCompletionRecord] = {}
        for record in self._completed_artifacts:
            if (
                record.record_id in requested
                and record.artifact_type == artifact_type
                and record.status == "Complete"
            ):
                result[record.record_id] = record
        return result

    def list_for_record(self, record_id: str) -> list[ArtifactCompletionRecord]:
        return [item for item in self._completed_artifacts if item.record_id == record_id]
