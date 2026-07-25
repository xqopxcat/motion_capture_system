from datetime import UTC, datetime, timedelta

from google.api_core.exceptions import GoogleAPIError, NotFound, PreconditionFailed
from google.cloud import storage
from google.oauth2 import service_account

from app.storage.contracts import SignedStorageUrl, StoredObjectMetadata
from app.storage.errors import StorageProviderError


class GcsStorageAdapter:
    def __init__(
        self,
        *,
        project_id: str,
        bucket_name: str,
        credentials_file: str | None = None,
        upload_ttl_seconds: int = 600,
        download_ttl_seconds: int = 600,
    ) -> None:
        credentials = (
            service_account.Credentials.from_service_account_file(credentials_file)
            if credentials_file
            else None
        )
        self.client = storage.Client(project=project_id, credentials=credentials)
        self.bucket = self.client.bucket(bucket_name)
        self.upload_ttl_seconds = upload_ttl_seconds
        self.download_ttl_seconds = download_ttl_seconds

    def create_upload_url(
        self, *, storage_path: str, content_type: str, checksum_sha256: str
    ) -> SignedStorageUrl:
        expires_at = datetime.now(UTC) + timedelta(seconds=self.upload_ttl_seconds)
        try:
            url = self.bucket.blob(storage_path).generate_signed_url(
                version="v4",
                expiration=expires_at,
                method="PUT",
                content_type=content_type,
                headers={"x-goog-meta-sha256": checksum_sha256},
                query_parameters={"ifGenerationMatch": "0"},
            )
        except (GoogleAPIError, ValueError, AttributeError) as error:
            raise StorageProviderError("Unable to sign GCS upload URL.") from error
        return SignedStorageUrl(url=url, expires_at=expires_at)

    def create_download_url(self, *, storage_path: str) -> SignedStorageUrl:
        expires_at = datetime.now(UTC) + timedelta(seconds=self.download_ttl_seconds)
        try:
            url = self.bucket.blob(storage_path).generate_signed_url(
                version="v4", expiration=expires_at, method="GET"
            )
        except (GoogleAPIError, ValueError, AttributeError) as error:
            raise StorageProviderError("Unable to sign GCS download URL.") from error
        return SignedStorageUrl(url=url, expires_at=expires_at)

    def get_object_metadata(self, *, storage_path: str) -> StoredObjectMetadata | None:
        blob = self.bucket.blob(storage_path)
        try:
            blob.reload()
        except NotFound:
            return None
        except GoogleAPIError as error:
            raise StorageProviderError("Unable to read GCS object metadata.") from error
        return StoredObjectMetadata(
            storage_path=storage_path,
            content_type=blob.content_type or "",
            size=int(blob.size or 0),
            generation=str(blob.generation),
            checksum_sha256=(blob.metadata or {}).get("sha256"),
        )

    def delete_object(self, *, storage_path: str, generation: str | None = None) -> bool:
        try:
            self.bucket.blob(storage_path, generation=generation).delete(
                if_generation_match=int(generation) if generation is not None else None
            )
            return True
        except NotFound:
            return False
        except PreconditionFailed as error:
            raise StorageProviderError("GCS object generation changed before deletion.") from error
        except GoogleAPIError as error:
            raise StorageProviderError("Unable to delete GCS object.") from error
