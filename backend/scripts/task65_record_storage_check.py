"""Verify live GCS object presence/absence for one Task 65 Record without printing paths."""

import argparse

from app.core.config import settings
from app.storage.gcs_adapter import GcsStorageAdapter


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record_id")
    parser.add_argument("--expect", required=True, choices=("present", "absent"))
    args = parser.parse_args()

    if settings.storage_adapter != "gcs":
        print("storage check requires STORAGE_ADAPTER=gcs")
        return 2

    storage = GcsStorageAdapter(
        project_id=settings.gcs_project_id or "",
        bucket_name=settings.gcs_bucket_name or "",
        credentials_file=settings.gcs_credentials_file,
    )
    marker = f"/records/{args.record_id}/"
    blobs = [blob for blob in storage.client.list_blobs(storage.bucket) if marker in blob.name]
    artifact_types = sorted(
        {
            blob.name.split(marker, 1)[1].split("/", 1)[0]
            for blob in blobs
            if marker in blob.name
        },
    )

    if args.expect == "present":
        passed = len(blobs) == 4 and artifact_types == ["metrics", "pose", "thumbnail", "video"]
    else:
        passed = len(blobs) == 0

    print(f"record_storage_{args.expect}={'PASS' if passed else 'FAIL'}")
    print(f"object_count={len(blobs)}")
    print(f"artifact_types={','.join(artifact_types) if artifact_types else 'none'}")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
