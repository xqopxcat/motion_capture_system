from pathlib import PurePosixPath
import re

_IDENTIFIER = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def _safe_identifier(value: str) -> str:
    if not _IDENTIFIER.fullmatch(value):
        raise ValueError("Unsafe storage path identifier.")
    return value


def record_prefix(owner_user_id: str, record_id: str) -> str:
    return f"users/{_safe_identifier(owner_user_id)}/records/{_safe_identifier(record_id)}"


def sanitize_extension(file_name: str, fallback: str) -> str:
    suffix = PurePosixPath(file_name).suffix.lstrip(".")

    return suffix or fallback


def build_video_storage_path(owner_user_id: str, record_id: str, file_name: str) -> str:
    extension = sanitize_extension(file_name, "webm").lower()
    if not re.fullmatch(r"[a-z0-9]{1,10}", extension):
        raise ValueError("Unsafe video extension.")

    return f"{record_prefix(owner_user_id, record_id)}/video/video.{extension}"


def build_pose_storage_path(owner_user_id: str, record_id: str) -> str:
    return f"{record_prefix(owner_user_id, record_id)}/pose/pose.v1.json"


def build_metrics_storage_path(owner_user_id: str, record_id: str) -> str:
    return f"{record_prefix(owner_user_id, record_id)}/metrics/metric-series.v1.json"


def build_thumbnail_storage_path(owner_user_id: str, record_id: str) -> str:
    return f"{record_prefix(owner_user_id, record_id)}/thumbnail/thumbnail.jpg"


def is_video_storage_path_for_record(owner_user_id: str, record_id: str, storage_path: str) -> bool:
    prefix = f"{record_prefix(owner_user_id, record_id)}/video/video."
    return storage_path.startswith(prefix) and "/" not in storage_path.removeprefix(
        f"{record_prefix(owner_user_id, record_id)}/video/",
    )


def is_pose_storage_path_for_record(owner_user_id: str, record_id: str, storage_path: str) -> bool:
    return storage_path == build_pose_storage_path(owner_user_id, record_id)


def is_metrics_storage_path_for_record(owner_user_id: str, record_id: str, storage_path: str) -> bool:
    return storage_path == build_metrics_storage_path(owner_user_id, record_id)


def is_thumbnail_storage_path_for_record(owner_user_id: str, record_id: str, storage_path: str) -> bool:
    return storage_path == build_thumbnail_storage_path(owner_user_id, record_id)
