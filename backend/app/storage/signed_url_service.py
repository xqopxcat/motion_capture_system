from datetime import UTC, datetime, timedelta
from urllib.parse import quote


class SignedUrlService:
    def __init__(self, expires_in_minutes: int = 10) -> None:
        self.expires_in_minutes = expires_in_minutes

    def expires_at(self) -> datetime:
        return datetime.now(UTC) + timedelta(minutes=self.expires_in_minutes)

    def create_upload_url(self, storage_path: str) -> str:
        encoded_path = quote(storage_path, safe="")

        return f"https://mock-storage.local/upload/{encoded_path}"

    def create_download_url(self, storage_path: str) -> str:
        encoded_path = quote(storage_path, safe="")

        return f"https://mock-storage.local/download/{encoded_path}"
