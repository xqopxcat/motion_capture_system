from app.repositories.artifact_repository import ArtifactRepository
from app.repositories.metric_summary_repository import MetricSummaryRepository
from app.repositories.record_repository import RecordRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository


record_repository = RecordRepository()
artifact_repository = ArtifactRepository()
metric_summary_repository = MetricSummaryRepository()
session_repository = SessionRepository()
user_repository = UserRepository()
