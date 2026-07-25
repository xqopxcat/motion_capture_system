from dataclasses import dataclass

from app.repositories.contracts import ArtifactRepositoryContract, RecordRepositoryContract
from app.storage.contracts import StorageAdapterContract
from app.storage.storage_paths import record_prefix


@dataclass(frozen=True)
class StorageCleanupResult:
    storage_path: str
    deleted: bool


class StorageCleanupService:
    """Exact-path cleanup primitive for Task 62; scheduling belongs to Task 65."""

    def __init__(self, records: RecordRepositoryContract, artifacts: ArtifactRepositoryContract,
                 storage: StorageAdapterContract) -> None:
        self.records = records
        self.artifacts = artifacts
        self.storage = storage

    def delete_record_objects(self, *, record_id: str, owner_user_id: str) -> list[StorageCleanupResult]:
        if not self.records.is_owned_by(record_id, owner_user_id):
            raise KeyError("Record does not exist.")
        prefix = record_prefix(owner_user_id, record_id) + "/"
        results: list[StorageCleanupResult] = []
        for artifact in self.artifacts.list_for_record(record_id):
            if not artifact.storage_path.startswith(prefix):
                raise ValueError("Refusing to delete an object outside the canonical record prefix.")
            results.append(StorageCleanupResult(
                storage_path=artifact.storage_path,
                deleted=self.storage.delete_object(
                    storage_path=artifact.storage_path, generation=artifact.object_generation
                ),
            ))
        return results

    def delete_partial_upload(self, *, record_id: str, owner_user_id: str,
                              storage_path: str) -> StorageCleanupResult:
        prefix = record_prefix(owner_user_id, record_id) + "/"
        if not self.records.is_owned_by(record_id, owner_user_id) or not storage_path.startswith(prefix):
            raise KeyError("Record or canonical object path does not exist.")
        artifact = next((x for x in self.artifacts.list_for_record(record_id)
                         if x.storage_path == storage_path and x.upload_state == "Pending"), None)
        if artifact is None:
            raise ValueError("Only a registered pending upload can be cleaned up.")
        return StorageCleanupResult(
            storage_path=storage_path,
            deleted=self.storage.delete_object(storage_path=storage_path),
        )
