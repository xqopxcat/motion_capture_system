from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class DashboardTrendRow:
    record_id: str
    record_title: str
    created_at: datetime
    metric_id: str
    unit: str
    metric_definition_version: str
    activity_type: str
    side: str
    average: float


@dataclass(frozen=True)
class DashboardSnapshot:
    total_records: int
    ready_records: int
    failed_records: int
    recent_activity_count: int
    records_with_summary: int
    records_with_compatible_summary: int
    trend_rows: tuple[DashboardTrendRow, ...]
