import os
from datetime import UTC, datetime

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.engine import build_engine, check_database_readiness
from app.models import Annotation, Artifact, MetricSummary, MetricSummaryItem, Record, User
from app.repositories.errors import DuplicateResourceError
from app.repositories.metric_summary_repository import MetricSummaryItemRecord
from app.repositories.postgresql import (
    PostgreSQLAnnotationRepository,
    PostgreSQLArtifactRepository,
    PostgreSQLDashboardRepository,
    PostgreSQLMetricSummaryRepository,
    PostgreSQLRecordRepository,
    PostgreSQLSessionRepository,
    PostgreSQLUserRepository,
)
from app.repositories.user_repository import StoredUser
from app.schemas.annotation import CreateAnnotationRequest
from app.schemas.record import CreateRecordRequest


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_POSTGRES_REPOSITORY_TESTS") != "1",
    reason="PostgreSQL repository tests require RUN_POSTGRES_REPOSITORY_TESTS=1 and a migrated local/test DATABASE_URL.",
)


@pytest.fixture
def pg_session() -> Session:
    settings = Settings()
    if settings.app_env in {"production", "production_like"}:
        pytest.fail("Repository integration tests refuse production and production_like.")
    engine = build_engine(settings)
    readiness = check_database_readiness(engine)
    if not readiness.connection_available or not readiness.migrations_at_head:
        pytest.fail("Repository integration tests require a reachable database at Alembic head.")
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, expire_on_commit=False)
    try:
        yield session
    finally:
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()
        engine.dispose()


def test_resources_persist_across_sqlalchemy_session_recreation(pg_session: Session) -> None:
    suffix = os.urandom(6).hex()
    users = PostgreSQLUserRepository(pg_session)
    sessions = PostgreSQLSessionRepository(pg_session)
    records = PostgreSQLRecordRepository(pg_session)
    artifacts = PostgreSQLArtifactRepository(pg_session)
    summaries = PostgreSQLMetricSummaryRepository(pg_session)
    annotations = PostgreSQLAnnotationRepository(pg_session)
    user = users.create(_user(suffix), provider_subject=f"subject-{suffix}")
    auth_session = sessions.create_for_user(user.user_id)
    record_id = records.create(_record_request(), owner_user_id=user.user_id).recordId
    artifacts.mark_complete(record_id=record_id, artifact_type="video", storage_path=f"videos/{record_id}/video.webm")
    summaries.persist_summary(record_id=record_id, items=[_metric(70)])
    annotation = annotations.create(record_id, _annotation_request(), author_user_id=user.user_id)
    pg_session.flush()

    connection = pg_session.connection()
    pg_session.close()
    recreated = Session(bind=connection, expire_on_commit=False)
    try:
        assert PostgreSQLUserRepository(recreated).get(user.user_id) is not None
        assert PostgreSQLSessionRepository(recreated).get_active(auth_session.session_id) is not None
        assert PostgreSQLRecordRepository(recreated).get_owned(record_id, user.user_id) is not None
        assert PostgreSQLArtifactRepository(recreated).has_completed(record_id=record_id, artifact_type="video")
        assert PostgreSQLMetricSummaryRepository(recreated).get_summary(record_id) is not None
        assert PostgreSQLAnnotationRepository(recreated).get_for_owned_record(annotation.annotation_id, record_id, user.user_id) is not None
    finally:
        recreated.close()


def test_owner_scoped_queries_and_dashboard_never_include_other_user(pg_session: Session) -> None:
    suffix = os.urandom(6).hex()
    users = PostgreSQLUserRepository(pg_session)
    records = PostgreSQLRecordRepository(pg_session)
    summaries = PostgreSQLMetricSummaryRepository(pg_session)
    owner = users.create(_user(f"owner-{suffix}"), provider_subject=f"owner-{suffix}")
    other = users.create(_user(f"other-{suffix}"), provider_subject=f"other-{suffix}")
    owner_record = records.create(_record_request("Owner"), owner_user_id=owner.user_id).recordId
    other_record = records.create(_record_request("Other"), owner_user_id=other.user_id).recordId
    records.update_status(owner_record, "Ready")
    records.update_status(other_record, "Ready")
    summaries.persist_summary(record_id=owner_record, items=[_metric(70)])
    summaries.persist_summary(record_id=other_record, items=[_metric(999)])

    assert records.get_owned(other_record, owner.user_id) is None
    assert [item.record_id for item in records.list_owned(owner.user_id)] == [owner_record]
    snapshot = PostgreSQLDashboardRepository(pg_session).get_snapshot(owner.user_id, datetime.now(UTC))
    assert snapshot.total_records == 1
    assert snapshot.ready_records == 1
    assert [row.record_id for row in snapshot.trend_rows] == [owner_record]
    assert [row.average for row in snapshot.trend_rows] == [70]


def test_metric_summary_duplicate_rolls_back_entire_operation(pg_session: Session) -> None:
    suffix = os.urandom(6).hex()
    user = PostgreSQLUserRepository(pg_session).create(_user(suffix), provider_subject=f"subject-{suffix}")
    record_id = PostgreSQLRecordRepository(pg_session).create(_record_request(), owner_user_id=user.user_id).recordId
    summaries = PostgreSQLMetricSummaryRepository(pg_session)
    duplicate = _metric(70)

    with pytest.raises(DuplicateResourceError):
        summaries.persist_summary(record_id=record_id, items=[duplicate, duplicate])
    pg_session.rollback()

    assert pg_session.scalar(select(func.count()).select_from(MetricSummary).where(MetricSummary.record_id == record_id)) == 0
    assert pg_session.scalar(select(func.count()).select_from(MetricSummaryItem)) == 0


def test_record_database_delete_cascades_all_child_metadata(pg_session: Session) -> None:
    suffix = os.urandom(6).hex()
    user = PostgreSQLUserRepository(pg_session).create(_user(suffix), provider_subject=f"subject-{suffix}")
    records = PostgreSQLRecordRepository(pg_session)
    record_id = records.create(_record_request(), owner_user_id=user.user_id).recordId
    PostgreSQLArtifactRepository(pg_session).mark_complete(record_id=record_id, artifact_type="video", storage_path=f"videos/{record_id}/video.webm")
    PostgreSQLMetricSummaryRepository(pg_session).persist_summary(record_id=record_id, items=[_metric(70)])
    PostgreSQLAnnotationRepository(pg_session).create(record_id, _annotation_request(), author_user_id=user.user_id)
    pg_session.flush()

    assert records.delete_owned(record_id, user.user_id)
    pg_session.flush()

    assert pg_session.scalar(select(func.count()).select_from(Artifact).where(Artifact.record_id == record_id)) == 0
    assert pg_session.scalar(select(func.count()).select_from(MetricSummary).where(MetricSummary.record_id == record_id)) == 0
    assert pg_session.scalar(select(func.count()).select_from(Annotation).where(Annotation.record_id == record_id)) == 0


def test_artifact_completion_is_one_row_and_annotation_is_owner_scoped(pg_session: Session) -> None:
    suffix = os.urandom(6).hex()
    users = PostgreSQLUserRepository(pg_session)
    owner = users.create(_user(f"owner-{suffix}"), provider_subject=f"owner-{suffix}")
    other = users.create(_user(f"other-{suffix}"), provider_subject=f"other-{suffix}")
    record_id = PostgreSQLRecordRepository(pg_session).create(_record_request(), owner_user_id=owner.user_id).recordId
    artifacts = PostgreSQLArtifactRepository(pg_session)
    artifacts.mark_complete(record_id=record_id, artifact_type="pose", storage_path=f"poses/{record_id}/pose.v1.json", version="1.0")
    artifacts.mark_complete(record_id=record_id, artifact_type="pose", storage_path=f"poses/{record_id}/pose.v1.json", version="1.0")
    annotation = PostgreSQLAnnotationRepository(pg_session).create(record_id, _annotation_request(), author_user_id=owner.user_id)

    assert pg_session.scalar(select(func.count()).select_from(Artifact).where(Artifact.record_id == record_id, Artifact.artifact_type == "pose")) == 1
    repository = PostgreSQLAnnotationRepository(pg_session)
    assert repository.get_for_owned_record(annotation.annotation_id, record_id, owner.user_id) is not None
    assert repository.get_for_owned_record(annotation.annotation_id, record_id, other.user_id) is None


def _user(suffix: str) -> StoredUser:
    return StoredUser(user_id=f"user_{suffix}", email=f"{suffix}@example.test", display_name=suffix, avatar_url=None, provider="dev")


def _record_request(title: str = "Persistent Record") -> CreateRecordRequest:
    return CreateRecordRequest(title=title, description="Task 60", tags=["persistent"])


def _metric(average: float) -> MetricSummaryItemRecord:
    return MetricSummaryItemRecord(metric_id="knee_flexion", unit="degree", metric_definition_version="v1", activity_type="squat", side="left", min=30, max=120, average=average, range_of_motion=90)


def _annotation_request() -> CreateAnnotationRequest:
    return CreateAnnotationRequest(frameIndex=12, timestamp=0.4, title="Persistent annotation", note="Task 60", jointId=25)
