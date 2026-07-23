from datetime import UTC, datetime, timedelta

from app.models import Annotation, Artifact, AuthSession, MetricSummary, MetricSummaryItem, Record, User


def make_user(suffix: str = "1") -> User:
    return User(
        id=f"user_{suffix}",
        identity_provider="test",
        provider_subject=f"subject_{suffix}",
        email=f"user-{suffix}@example.test",
        display_name=f"Test User {suffix}",
    )


def make_session(user: User, suffix: str = "1") -> AuthSession:
    now = datetime.now(UTC)
    return AuthSession(
        id=f"session_{suffix}",
        token_hash=f"sha256:{suffix:0>64}",
        user=user,
        expires_at=now + timedelta(hours=1),
        last_used_at=now,
    )


def make_record(user: User, suffix: str = "1", *, status: str = "Uploading") -> Record:
    return Record(
        id=f"record_{suffix}",
        owner=user,
        title=f"Test Record {suffix}",
        description="Factory-created test Record",
        tags=["test"],
        status=status,
        uploading_at=datetime.now(UTC),
    )


def make_artifact(record: Record, artifact_type: str = "video", suffix: str = "1") -> Artifact:
    return Artifact(
        id=f"artifact_{suffix}",
        record=record,
        artifact_type=artifact_type,
        storage_path=f"test/{record.id}/{artifact_type}-{suffix}",
        content_type="video/webm" if artifact_type == "video" else "application/json",
        expected_file_size=128,
        checksum_algorithm="sha256",
        expected_checksum="a" * 64,
        integrity_state="Pending",
        upload_state="Pending",
    )


def make_metric_summary(record: Record, suffix: str = "1") -> MetricSummary:
    summary = MetricSummary(id=f"summary_{suffix}", record=record)
    summary.items.append(
        MetricSummaryItem(
            id=f"summary_item_{suffix}",
            metric_id="knee-angle",
            unit="deg",
            metric_definition_version="1.0",
            activity_type="squat",
            side="left",
            minimum=40,
            maximum=120,
            average=80,
            range_of_motion=80,
            standard_deviation=4,
        ),
    )
    return summary


def make_annotation(record: Record, author: User, suffix: str = "1") -> Annotation:
    return Annotation(
        id=f"annotation_{suffix}",
        record=record,
        author=author,
        frame_index=10,
        timestamp=0.333,
        joint_id=25,
        title="Test annotation",
        note="Factory-created test annotation",
    )
