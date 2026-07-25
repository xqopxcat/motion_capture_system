from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class SignedStorageUrl:
    url: str
    expires_at: datetime


@dataclass(frozen=True)
class StoredObjectMetadata:
    storage_path: str
    content_type: str
    size: int
    generation: str
    checksum_sha256: str | None


class StorageAdapterContract(Protocol):
    def create_upload_url(
        self, *, storage_path: str, content_type: str, checksum_sha256: str
    ) -> SignedStorageUrl: ...

    def create_download_url(self, *, storage_path: str) -> SignedStorageUrl: ...

    def get_object_metadata(self, *, storage_path: str) -> StoredObjectMetadata | None: ...

    def delete_object(self, *, storage_path: str, generation: str | None = None) -> bool: ...

