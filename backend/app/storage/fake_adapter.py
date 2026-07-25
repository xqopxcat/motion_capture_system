from datetime import UTC, datetime, timedelta
from urllib.parse import quote

from app.storage.contracts import SignedStorageUrl, StoredObjectMetadata


class FakeStorageAdapter:
    """Deterministic test double. Never selected by local or production runtime."""

    def __init__(self, expires_in_seconds: int = 600) -> None:
        self.expires_in_seconds = expires_in_seconds
        self.objects: dict[str, StoredObjectMetadata] = {}

    def _signed(self, operation: str, storage_path: str) -> SignedStorageUrl:
        expires_at = datetime.now(UTC) + timedelta(seconds=self.expires_in_seconds)
        return SignedStorageUrl(
            url=f"https://mock-storage.local/{operation}/{quote(storage_path, safe='')}",
            expires_at=expires_at,
        )

    def create_upload_url(
        self, *, storage_path: str, content_type: str, checksum_sha256: str
    ) -> SignedStorageUrl:
        return self._signed("upload", storage_path)

    def create_download_url(self, *, storage_path: str) -> SignedStorageUrl:
        return self._signed("download", storage_path)

    def get_object_metadata(self, *, storage_path: str) -> StoredObjectMetadata | None:
        return self.objects.get(storage_path)

    def put_test_object(
        self,
        *,
        storage_path: str,
        content_type: str,
        size: int,
        checksum_sha256: str,
        generation: str = "1",
    ) -> None:
        self.objects[storage_path] = StoredObjectMetadata(
            storage_path=storage_path,
            content_type=content_type,
            size=size,
            generation=generation,
            checksum_sha256=checksum_sha256,
        )

    def delete_object(self, *, storage_path: str, generation: str | None = None) -> bool:
        metadata = self.objects.get(storage_path)
        if metadata is None:
            return False
        if generation is not None and metadata.generation != generation:
            return False
        del self.objects[storage_path]
        return True
