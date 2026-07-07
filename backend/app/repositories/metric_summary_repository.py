from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class MetricSummaryItemRecord:
    metric_id: str
    min: float
    max: float
    average: float
    range_of_motion: float


@dataclass(frozen=True)
class MetricSummaryRecord:
    record_id: str
    items: tuple[MetricSummaryItemRecord, ...]
    persisted_at: datetime


class MetricSummaryRepository:
    def __init__(self) -> None:
        self._summaries: dict[str, MetricSummaryRecord] = {}

    def persist_summary(
        self,
        *,
        record_id: str,
        items: list[MetricSummaryItemRecord],
    ) -> MetricSummaryRecord:
        record = MetricSummaryRecord(
            record_id=record_id,
            items=tuple(items),
            persisted_at=datetime.now(UTC),
        )
        self._summaries[record_id] = record

        return record

    def get_summary(self, record_id: str) -> MetricSummaryRecord | None:
        return self._summaries.get(record_id)
