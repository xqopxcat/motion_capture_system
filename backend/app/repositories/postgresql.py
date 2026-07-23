from __future__ import annotations

from datetime import UTC, datetime, timedelta
from hashlib import sha256
from uuid import uuid4

from sqlalchemy import and_, case, delete, distinct, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Annotation, Artifact, AuthSession, MetricSummary, MetricSummaryItem, Record, User
from app.repositories.annotation_repository import StoredAnnotation
from app.repositories.artifact_repository import ArtifactCompletionRecord, ArtifactType
from app.repositories.dashboard_repository import DashboardSnapshot, DashboardTrendRow
from app.repositories.errors import DuplicateResourceError, ReferencedResourceMissingError
from app.repositories.metric_summary_repository import MetricSummaryItemRecord, MetricSummaryRecord
from app.repositories.record_repository import StoredRecord
from app.repositories.session_repository import StoredSession
from app.repositories.user_repository import StoredUser
from app.schemas.annotation import CreateAnnotationRequest, UpdateAnnotationRequest
from app.schemas.auth import AuthProvider
from app.schemas.record import CreateRecordRequest, CreateRecordResponse, RecordStatus


def _integrity_error(error: IntegrityError, message: str) -> DuplicateResourceError:
    return DuplicateResourceError(message)


class PostgreSQLUserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: str) -> StoredUser | None:
        return self._stored(self.session.get(User, user_id))

    def get_by_provider_identity(self, provider: str, provider_subject: str) -> StoredUser | None:
        model = self.session.scalar(
            select(User).where(
                User.identity_provider == provider,
                User.provider_subject == provider_subject,
            ),
        )
        return self._stored(model)

    def create(self, user: StoredUser, *, provider_subject: str) -> StoredUser:
        model = User(
            id=user.user_id,
            identity_provider=user.provider,
            provider_subject=provider_subject,
            email=user.email,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
        )
        self.session.add(model)
        try:
            self.session.flush()
        except IntegrityError as error:
            raise _integrity_error(error, "User provider identity already exists.") from error
        return self._stored(model)  # type: ignore[return-value]

    def update_profile(self, user_id: str, *, email: str, display_name: str, avatar_url: str | None) -> StoredUser:
        model = self.session.get(User, user_id)
        if model is None:
            raise KeyError(f"User does not exist: {user_id}")
        model.email = email
        model.display_name = display_name
        model.avatar_url = avatar_url
        self.session.flush()
        return self._stored(model)  # type: ignore[return-value]

    def get_or_create_demo_user(self, provider: AuthProvider) -> StoredUser:
        user_id = "user_demo" if provider == "google" else "user_dev"
        existing = self.get(user_id)
        if existing is not None:
            return existing
        user = StoredUser(
            user_id=user_id,
            email="demo@example.com" if provider == "google" else "dev@example.com",
            display_name="Demo User" if provider == "google" else "Dev User",
            avatar_url=None,
            provider=provider,
        )
        return self.create(user, provider_subject=f"task60-local-{provider}")

    @staticmethod
    def _stored(model: User | None) -> StoredUser | None:
        if model is None:
            return None
        return StoredUser(
            user_id=model.id,
            email=model.email,
            display_name=model.display_name,
            avatar_url=model.avatar_url,
            provider=model.identity_provider,  # type: ignore[arg-type]
        )


class PostgreSQLSessionRepository:
    def __init__(self, session: Session, lifetime: timedelta = timedelta(hours=24)) -> None:
        self.session = session
        self.lifetime = lifetime

    @staticmethod
    def _hash(raw: str) -> str:
        return sha256(raw.encode("utf-8")).hexdigest()

    def create_for_user(self, user_id: str) -> StoredSession:
        raw = f"session_{uuid4().hex}"
        now = datetime.now(UTC)
        model = AuthSession(
            id=f"auth_session_{uuid4().hex}",
            token_hash=self._hash(raw),
            user_id=user_id,
            expires_at=now + self.lifetime,
            last_used_at=now,
        )
        self.session.add(model)
        try:
            self.session.flush()
        except IntegrityError as error:
            raise _integrity_error(error, "Session token already exists or user is missing.") from error
        return StoredSession(session_id=raw, user_id=user_id, created_at=now)

    def get(self, session_id: str) -> StoredSession | None:
        model = self.session.scalar(select(AuthSession).where(AuthSession.token_hash == self._hash(session_id)))
        return self._stored(model, session_id)

    def get_active(self, session_id: str, *, now: datetime | None = None) -> StoredSession | None:
        reference = now or datetime.now(UTC)
        model = self.session.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == self._hash(session_id),
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > reference,
            ),
        )
        if model is not None:
            model.last_used_at = reference
            self.session.flush()
        return self._stored(model, session_id)

    def revoke(self, session_id: str, *, revoked_at: datetime | None = None) -> bool:
        model = self.session.scalar(select(AuthSession).where(AuthSession.token_hash == self._hash(session_id)))
        if model is None:
            return False
        model.revoked_at = revoked_at or datetime.now(UTC)
        self.session.flush()
        return True

    def delete(self, session_id: str) -> bool:
        model = self.session.scalar(select(AuthSession).where(AuthSession.token_hash == self._hash(session_id)))
        if model is None:
            return False
        self.session.delete(model)
        self.session.flush()
        return True

    def delete_expired(self, *, now: datetime | None = None) -> int:
        result = self.session.execute(delete(AuthSession).where(AuthSession.expires_at <= (now or datetime.now(UTC))))
        self.session.flush()
        return result.rowcount or 0

    @staticmethod
    def _stored(model: AuthSession | None, raw: str) -> StoredSession | None:
        if model is None:
            return None
        return StoredSession(session_id=raw, user_id=model.user_id, created_at=model.created_at)


class PostgreSQLRecordRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, request: CreateRecordRequest, *, owner_user_id: str) -> CreateRecordResponse:
        model = Record(
            id=f"record_{uuid4().hex}",
            owner_user_id=owner_user_id,
            title=request.title,
            description=request.description,
            tags=list(request.tags),
            status="Uploading",
            uploading_at=datetime.now(UTC),
        )
        self.session.add(model)
        try:
            self.session.flush()
        except IntegrityError as error:
            raise ReferencedResourceMissingError("Record owner does not exist.") from error
        return CreateRecordResponse(recordId=model.id, status="Uploading")

    def exists(self, record_id: str) -> bool:
        return self.session.scalar(select(func.count()).select_from(Record).where(Record.id == record_id)) == 1

    def is_owned_by(self, record_id: str, owner_user_id: str) -> bool:
        return self.session.scalar(
            select(func.count()).select_from(Record).where(Record.id == record_id, Record.owner_user_id == owner_user_id),
        ) == 1

    def update_status(self, record_id: str, status: RecordStatus) -> CreateRecordResponse:
        model = self.session.get(Record, record_id)
        if model is None:
            raise KeyError(f"Record does not exist: {record_id}")
        model.status = status
        self.session.flush()
        return CreateRecordResponse(recordId=model.id, status=status)

    def get(self, record_id: str) -> StoredRecord | None:
        return self._stored(self.session.get(Record, record_id))

    def get_owned(self, record_id: str, owner_user_id: str) -> StoredRecord | None:
        return self._stored(
            self.session.scalar(select(Record).where(Record.id == record_id, Record.owner_user_id == owner_user_id)),
        )

    def list(self) -> list[StoredRecord]:
        return [self._stored(item) for item in self.session.scalars(select(Record).order_by(Record.created_at.desc()))]  # type: ignore[list-item]

    def list_owned(self, owner_user_id: str) -> list[StoredRecord]:
        return [
            self._stored(item)  # type: ignore[misc]
            for item in self.session.scalars(
                select(Record).where(Record.owner_user_id == owner_user_id).order_by(Record.created_at.desc()),
            )
        ]

    def delete_owned(self, record_id: str, owner_user_id: str) -> bool:
        model = self.session.scalar(select(Record).where(Record.id == record_id, Record.owner_user_id == owner_user_id))
        if model is None:
            return False
        self.session.delete(model)
        self.session.flush()
        return True

    @staticmethod
    def _stored(model: Record | None) -> StoredRecord | None:
        if model is None:
            return None
        return StoredRecord(
            record_id=model.id,
            owner_user_id=model.owner_user_id,
            title=model.title,
            description=model.description,
            tags=tuple(model.tags),
            status=model.status,  # type: ignore[arg-type]
            created_at=model.created_at,
        )


class PostgreSQLArtifactRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def mark_complete(self, *, record_id: str, artifact_type: ArtifactType, storage_path: str, version: str | None = None, generated_from_frame_index: int | None = None) -> ArtifactCompletionRecord:
        model = self.session.scalar(select(Artifact).where(Artifact.record_id == record_id, Artifact.artifact_type == artifact_type))
        now = datetime.now(UTC)
        if model is None:
            model = Artifact(
                id=f"artifact_{uuid4().hex}", record_id=record_id, artifact_type=artifact_type,
                storage_path=storage_path, schema_version=version, content_type=self._legacy_content_type(artifact_type),
                expected_file_size=1, integrity_state="Pending", upload_state="Complete", completed_at=now,
            )
            self.session.add(model)
        else:
            model.storage_path = storage_path
            model.schema_version = version or model.schema_version
            model.upload_state = "Complete"
            model.completed_at = now
        try:
            self.session.flush()
        except IntegrityError as error:
            raise _integrity_error(error, "Artifact type or storage path already exists.") from error
        return self._stored(model, generated_from_frame_index)

    def has_completed(self, *, record_id: str, artifact_type: ArtifactType) -> bool:
        return self.session.scalar(select(func.count()).select_from(Artifact).where(Artifact.record_id == record_id, Artifact.artifact_type == artifact_type, Artifact.upload_state == "Complete")) == 1

    def get_completed(self, *, record_id: str, artifact_type: ArtifactType) -> ArtifactCompletionRecord | None:
        return self._stored_optional(self.session.scalar(select(Artifact).where(Artifact.record_id == record_id, Artifact.artifact_type == artifact_type, Artifact.upload_state == "Complete")))

    def get_completed_owned(self, *, record_id: str, artifact_type: ArtifactType, owner_user_id: str) -> ArtifactCompletionRecord | None:
        model = self.session.scalar(
            select(Artifact).join(Record, Record.id == Artifact.record_id).where(
                Artifact.record_id == record_id, Artifact.artifact_type == artifact_type,
                Artifact.upload_state == "Complete", Record.owner_user_id == owner_user_id,
            ),
        )
        return self._stored_optional(model)

    def get_completed_for_records(
        self,
        record_ids: list[str],
        artifact_type: ArtifactType,
    ) -> dict[str, ArtifactCompletionRecord]:
        if not record_ids:
            return {}
        models = self.session.scalars(
            select(Artifact).where(
                Artifact.record_id.in_(record_ids),
                Artifact.artifact_type == artifact_type,
                Artifact.upload_state == "Complete",
            ),
        )
        return {model.record_id: self._stored(model) for model in models}

    def list_for_record(self, record_id: str) -> list[ArtifactCompletionRecord]:
        return [self._stored(item) for item in self.session.scalars(select(Artifact).where(Artifact.record_id == record_id).order_by(Artifact.artifact_type))]

    @staticmethod
    def _legacy_content_type(artifact_type: ArtifactType) -> str:
        return "video/webm" if artifact_type == "video" else "image/jpeg" if artifact_type == "thumbnail" else "application/json"

    @staticmethod
    def _stored(model: Artifact, generated_from_frame_index: int | None = None) -> ArtifactCompletionRecord:
        return ArtifactCompletionRecord(record_id=model.record_id, artifact_type=model.artifact_type, storage_path=model.storage_path, status="Complete", completed_at=model.completed_at or model.updated_at, version=model.schema_version, generated_from_frame_index=generated_from_frame_index)  # type: ignore[arg-type]

    def _stored_optional(self, model: Artifact | None) -> ArtifactCompletionRecord | None:
        return None if model is None else self._stored(model)


class PostgreSQLMetricSummaryRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def persist_summary(self, *, record_id: str, items: list[MetricSummaryItemRecord]) -> MetricSummaryRecord:
        model = self.session.scalar(select(MetricSummary).where(MetricSummary.record_id == record_id))
        if model is None:
            model = MetricSummary(id=f"summary_{uuid4().hex}", record_id=record_id)
            self.session.add(model)
            try:
                self.session.flush()
            except IntegrityError as error:
                raise ReferencedResourceMissingError("Metric Summary Record does not exist.") from error
        else:
            self.session.execute(delete(MetricSummaryItem).where(MetricSummaryItem.summary_id == model.id))
        for item in items:
            self.session.add(MetricSummaryItem(
                id=f"summary_item_{uuid4().hex}", summary_id=model.id, metric_id=item.metric_id,
                unit=item.unit, metric_definition_version=item.metric_definition_version,
                activity_type=item.activity_type, side=item.side, minimum=item.min, maximum=item.max,
                average=item.average, range_of_motion=item.range_of_motion,
            ))
        try:
            self.session.flush()
        except IntegrityError as error:
            raise _integrity_error(error, "Metric Summary contains duplicate or invalid items.") from error
        return self.get_summary(record_id)  # type: ignore[return-value]

    def get_summary(self, record_id: str) -> MetricSummaryRecord | None:
        model = self.session.scalar(select(MetricSummary).where(MetricSummary.record_id == record_id))
        return self._stored(model)

    def get_summary_owned(self, record_id: str, owner_user_id: str) -> MetricSummaryRecord | None:
        model = self.session.scalar(select(MetricSummary).join(Record).where(MetricSummary.record_id == record_id, Record.owner_user_id == owner_user_id))
        return self._stored(model)

    def get_summaries(self, record_ids: list[str]) -> dict[str, MetricSummaryRecord]:
        if not record_ids:
            return {}
        return {item.record_id: stored for item in self.session.scalars(select(MetricSummary).where(MetricSummary.record_id.in_(record_ids))) if (stored := self._stored(item)) is not None}

    def _stored(self, model: MetricSummary | None) -> MetricSummaryRecord | None:
        if model is None:
            return None
        items = self.session.scalars(select(MetricSummaryItem).where(MetricSummaryItem.summary_id == model.id).order_by(MetricSummaryItem.metric_id)).all()
        return MetricSummaryRecord(
            record_id=model.record_id,
            items=tuple(MetricSummaryItemRecord(metric_id=item.metric_id, unit=item.unit, metric_definition_version=item.metric_definition_version, activity_type=item.activity_type, side=item.side, min=item.minimum, max=item.maximum, average=item.average, range_of_motion=item.range_of_motion) for item in items),
            persisted_at=model.updated_at,
        )


class PostgreSQLAnnotationRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, record_id: str, request: CreateAnnotationRequest, *, author_user_id: str) -> StoredAnnotation:
        model = Annotation(id=f"annotation_{uuid4().hex}", record_id=record_id, author_user_id=author_user_id, frame_index=request.frameIndex, timestamp=request.timestamp, title=request.title.strip(), note=request.note, joint_id=request.jointId)
        self.session.add(model)
        try:
            self.session.flush()
        except IntegrityError as error:
            raise ReferencedResourceMissingError("Annotation Record or author does not exist.") from error
        return self._stored(model)

    def list_for_record(self, record_id: str) -> list[StoredAnnotation]:
        return [self._stored(item) for item in self.session.scalars(select(Annotation).where(Annotation.record_id == record_id).order_by(Annotation.frame_index, Annotation.timestamp, Annotation.created_at))]

    def list_for_owned_record(self, record_id: str, owner_user_id: str) -> list[StoredAnnotation]:
        return [self._stored(item) for item in self.session.scalars(select(Annotation).join(Record).where(Annotation.record_id == record_id, Record.owner_user_id == owner_user_id).order_by(Annotation.frame_index, Annotation.timestamp, Annotation.created_at))]

    def get(self, annotation_id: str) -> StoredAnnotation | None:
        model = self.session.get(Annotation, annotation_id)
        return None if model is None else self._stored(model)

    def get_for_owned_record(self, annotation_id: str, record_id: str, owner_user_id: str) -> StoredAnnotation | None:
        model = self.session.scalar(select(Annotation).join(Record).where(Annotation.id == annotation_id, Annotation.record_id == record_id, Record.owner_user_id == owner_user_id))
        return None if model is None else self._stored(model)

    def update(self, annotation_id: str, request: UpdateAnnotationRequest) -> StoredAnnotation:
        model = self.session.get(Annotation, annotation_id)
        if model is None:
            raise KeyError(f"Annotation does not exist: {annotation_id}")
        if request.title is not None:
            model.title = request.title.strip()
        if request.note is not None:
            model.note = request.note
        self.session.flush()
        return self._stored(model)

    def delete(self, annotation_id: str) -> None:
        model = self.session.get(Annotation, annotation_id)
        if model is None:
            raise KeyError(f"Annotation does not exist: {annotation_id}")
        self.session.delete(model)
        self.session.flush()

    @staticmethod
    def _stored(model: Annotation) -> StoredAnnotation:
        return StoredAnnotation(annotation_id=model.id, record_id=model.record_id, frame_index=model.frame_index, timestamp=model.timestamp, title=model.title, note=model.note, joint_id=model.joint_id, author_user_id=model.author_user_id, created_at=model.created_at, updated_at=model.updated_at)


class PostgreSQLDashboardRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_snapshot(self, owner_user_id: str, reference_time: datetime) -> DashboardSnapshot:
        recent_boundary = reference_time - timedelta(days=30)
        counts = self.session.execute(
            select(
                func.count(Record.id),
                func.sum(case((Record.status == "Ready", 1), else_=0)),
                func.sum(case((Record.status == "Failed", 1), else_=0)),
                func.sum(case((and_(Record.created_at >= recent_boundary, Record.created_at <= reference_time), 1), else_=0)),
            ).where(Record.owner_user_id == owner_user_id),
        ).one()
        ready_records = select(Record.id).where(Record.owner_user_id == owner_user_id, Record.status == "Ready").subquery()
        records_with_summary = self.session.scalar(select(func.count(distinct(MetricSummary.record_id))).join(ready_records, ready_records.c.id == MetricSummary.record_id)) or 0
        compatible_filter = and_(MetricSummaryItem.unit.is_not(None), MetricSummaryItem.metric_definition_version.is_not(None), MetricSummaryItem.activity_type.is_not(None), MetricSummaryItem.side.is_not(None))
        compatible_count = self.session.scalar(select(func.count(distinct(MetricSummary.record_id))).join(ready_records, ready_records.c.id == MetricSummary.record_id).join(MetricSummaryItem).where(compatible_filter)) or 0
        rows = self.session.execute(
            select(Record.id, Record.title, Record.created_at, MetricSummaryItem.metric_id, MetricSummaryItem.unit, MetricSummaryItem.metric_definition_version, MetricSummaryItem.activity_type, MetricSummaryItem.side, MetricSummaryItem.average)
            .join(MetricSummary, MetricSummary.record_id == Record.id).join(MetricSummaryItem, MetricSummaryItem.summary_id == MetricSummary.id)
            .where(Record.owner_user_id == owner_user_id, Record.status == "Ready", compatible_filter)
            .order_by(MetricSummaryItem.metric_id, MetricSummaryItem.unit, MetricSummaryItem.metric_definition_version, MetricSummaryItem.activity_type, MetricSummaryItem.side, Record.created_at),
        ).all()
        return DashboardSnapshot(
            total_records=counts[0] or 0, ready_records=counts[1] or 0, failed_records=counts[2] or 0,
            recent_activity_count=counts[3] or 0, records_with_summary=records_with_summary,
            records_with_compatible_summary=compatible_count,
            trend_rows=tuple(DashboardTrendRow(record_id=row[0], record_title=row[1], created_at=row[2], metric_id=row[3], unit=row[4], metric_definition_version=row[5], activity_type=row[6], side=row[7], average=row[8]) for row in rows),
        )
