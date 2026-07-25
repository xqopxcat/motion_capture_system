"""Live Task 62 GCS smoke test.

Creates one isolated object, validates metadata and signed download, then deletes it.
No signed URL or credential material is printed.
"""

from __future__ import annotations

import hashlib
import json
import time
from uuid import uuid4

import requests

from app.core.config import settings
from app.storage.gcs_adapter import GcsStorageAdapter
from app.storage.runtime import get_storage_adapter


def main() -> None:
    storage = get_storage_adapter()
    payload = json.dumps(
        {"schemaVersion": "pose.v1", "smokeTest": True},
        separators=(",", ":"),
    ).encode()
    checksum = hashlib.sha256(payload).hexdigest()
    storage_path = (
        f"users/task62-smoke/records/smoke-{uuid4().hex}/pose/pose.v1.json"
    )
    generation: str | None = None

    try:
        upload = storage.create_upload_url(
            storage_path=storage_path,
            content_type="application/json",
            checksum_sha256=checksum,
        )
        upload_response = requests.put(
            upload.url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "x-goog-meta-sha256": checksum,
            },
            timeout=30,
        )
        upload_response.raise_for_status()

        metadata = storage.get_object_metadata(storage_path=storage_path)
        if metadata is None:
            raise RuntimeError("Uploaded object metadata was not found.")
        generation = metadata.generation
        if metadata.content_type != "application/json":
            raise RuntimeError("Content-Type validation failed.")
        if metadata.size != len(payload):
            raise RuntimeError("Object size validation failed.")
        if metadata.checksum_sha256 != checksum:
            raise RuntimeError("SHA-256 metadata validation failed.")

        download = storage.create_download_url(storage_path=storage_path)
        download_response = requests.get(download.url, timeout=30)
        download_response.raise_for_status()
        if download_response.content != payload:
            raise RuntimeError("Signed download content validation failed.")

        expiry_storage = GcsStorageAdapter(
            project_id=settings.gcs_project_id or "",
            bucket_name=settings.gcs_bucket_name or "",
            credentials_file=settings.gcs_credentials_file,
            download_ttl_seconds=1,
        )
        expiring_download = expiry_storage.create_download_url(
            storage_path=storage_path,
        )
        time.sleep(2)
        expired_response = requests.get(expiring_download.url, timeout=30)
        if expired_response.status_code not in {400, 401, 403}:
            raise RuntimeError(
                f"Expired signed URL was not rejected: {expired_response.status_code}"
            )

        deleted = storage.delete_object(
            storage_path=storage_path,
            generation=generation,
        )
        if not deleted:
            raise RuntimeError("Generation-bound object deletion failed.")
        generation = None
        if storage.get_object_metadata(storage_path=storage_path) is not None:
            raise RuntimeError("Object still exists after deletion.")

        print("signed_upload=PASS")
        print("metadata_content_type_size_sha256_generation=PASS")
        print("signed_download=PASS")
        print("signed_url_expiry=PASS")
        print("generation_bound_delete=PASS")
        print("post_delete_not_found=PASS")
    finally:
        if generation is not None:
            storage.delete_object(storage_path=storage_path, generation=generation)


if __name__ == "__main__":
    main()
