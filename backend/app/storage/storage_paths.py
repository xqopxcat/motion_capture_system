from pathlib import PurePosixPath


def sanitize_extension(file_name: str, fallback: str) -> str:
    suffix = PurePosixPath(file_name).suffix.lstrip(".")

    return suffix or fallback


def build_video_storage_path(record_id: str, file_name: str) -> str:
    extension = sanitize_extension(file_name, "webm")

    return f"videos/{record_id}/video.{extension}"


def build_pose_storage_path(record_id: str) -> str:
    return f"poses/{record_id}/pose.v1.json"


def build_metrics_storage_path(record_id: str) -> str:
    return f"metrics/{record_id}/metric-series.v1.json"


def build_thumbnail_storage_path(record_id: str) -> str:
    return f"thumbnails/{record_id}/thumbnail.jpg"
