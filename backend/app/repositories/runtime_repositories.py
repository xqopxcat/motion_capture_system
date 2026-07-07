from app.repositories.artifact_repository import ArtifactRepository
from app.repositories.metric_summary_repository import MetricSummaryRepository
from app.repositories.record_repository import RecordRepository


record_repository = RecordRepository()
artifact_repository = ArtifactRepository()
metric_summary_repository = MetricSummaryRepository()
