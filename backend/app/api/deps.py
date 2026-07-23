from collections.abc import Iterator
from typing import cast

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.runtime import get_runtime_session_factory
from app.repositories.contracts import (
    AnnotationRepositoryContract,
    ArtifactRepositoryContract,
    DashboardRepositoryContract,
    MetricSummaryRepositoryContract,
    RecordRepositoryContract,
    SessionRepositoryContract,
    UserRepositoryContract,
)
from app.repositories.runtime_repositories import RepositoryBundle, create_postgresql_repository_bundle
from app.schemas.auth import CurrentUser
from app.services.annotation_service import AnnotationService
from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.record_service import RecordService
from app.services.upload_service import UploadService


def get_db_session() -> Iterator[Session]:
    session = get_runtime_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_repository_bundle(session: Session = Depends(get_db_session)) -> RepositoryBundle:
    return create_postgresql_repository_bundle(session)


def get_auth_service(bundle: RepositoryBundle = Depends(get_repository_bundle)) -> AuthService:
    return AuthService(
        cast(UserRepositoryContract, bundle.users),
        cast(SessionRepositoryContract, bundle.sessions),
    )


def get_record_service(bundle: RepositoryBundle = Depends(get_repository_bundle)) -> RecordService:
    return RecordService(
        cast(RecordRepositoryContract, bundle.records),
        cast(ArtifactRepositoryContract, bundle.artifacts),
        cast(MetricSummaryRepositoryContract, bundle.metric_summaries),
    )


def get_upload_service(bundle: RepositoryBundle = Depends(get_repository_bundle)) -> UploadService:
    return UploadService(
        artifact_repository=cast(ArtifactRepositoryContract, bundle.artifacts),
        metric_summary_repository=cast(MetricSummaryRepositoryContract, bundle.metric_summaries),
        record_repository=cast(RecordRepositoryContract, bundle.records),
    )


def get_annotation_service(bundle: RepositoryBundle = Depends(get_repository_bundle)) -> AnnotationService:
    return AnnotationService(
        cast(AnnotationRepositoryContract, bundle.annotations),
        cast(RecordRepositoryContract, bundle.records),
    )


def get_dashboard_service(bundle: RepositoryBundle = Depends(get_repository_bundle)) -> DashboardService:
    return DashboardService(
        cast(RecordRepositoryContract, bundle.records),
        cast(MetricSummaryRepositoryContract, bundle.metric_summaries),
        cast(DashboardRepositoryContract, bundle.dashboard),
    )


def current_user(
    session_id: str | None = Cookie(default=None, alias=settings.session_cookie_name),
    auth_service: AuthService = Depends(get_auth_service),
) -> CurrentUser:
    user = auth_service.get_current_user(session_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required."},
        )
    return user
