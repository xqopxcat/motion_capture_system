"""Explicit repository bundle factories; this module owns no mutable singleton state."""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.repositories.annotation_repository import AnnotationRepository
from app.repositories.artifact_repository import ArtifactRepository
from app.repositories.metric_summary_repository import MetricSummaryRepository
from app.repositories.postgresql import (
    PostgreSQLAnnotationRepository,
    PostgreSQLArtifactRepository,
    PostgreSQLDashboardRepository,
    PostgreSQLMetricSummaryRepository,
    PostgreSQLRecordRepository,
    PostgreSQLSessionRepository,
    PostgreSQLUserRepository,
)
from app.repositories.record_repository import RecordRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository


@dataclass(frozen=True)
class RepositoryBundle:
    users: object
    sessions: object
    records: object
    artifacts: object
    metric_summaries: object
    annotations: object
    dashboard: object | None = None


def create_postgresql_repository_bundle(session: Session) -> RepositoryBundle:
    return RepositoryBundle(
        users=PostgreSQLUserRepository(session),
        sessions=PostgreSQLSessionRepository(session),
        records=PostgreSQLRecordRepository(session),
        artifacts=PostgreSQLArtifactRepository(session),
        metric_summaries=PostgreSQLMetricSummaryRepository(session),
        annotations=PostgreSQLAnnotationRepository(session),
        dashboard=PostgreSQLDashboardRepository(session),
    )


def create_in_memory_repository_bundle() -> RepositoryBundle:
    return RepositoryBundle(
        users=UserRepository(),
        sessions=SessionRepository(),
        records=RecordRepository(),
        artifacts=ArtifactRepository(),
        metric_summaries=MetricSummaryRepository(),
        annotations=AnnotationRepository(),
    )
