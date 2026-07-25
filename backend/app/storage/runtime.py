from functools import lru_cache

from app.core.config import settings
from app.storage.contracts import StorageAdapterContract
from app.storage.fake_adapter import FakeStorageAdapter


@lru_cache
def get_storage_adapter() -> StorageAdapterContract:
    if settings.storage_adapter == "fake":
        return FakeStorageAdapter(settings.storage_upload_ttl_seconds)

    from app.storage.gcs_adapter import GcsStorageAdapter

    return GcsStorageAdapter(
        project_id=settings.gcs_project_id or "",
        bucket_name=settings.gcs_bucket_name or "",
        credentials_file=settings.gcs_credentials_file,
        upload_ttl_seconds=settings.storage_upload_ttl_seconds,
        download_ttl_seconds=settings.storage_download_ttl_seconds,
    )
