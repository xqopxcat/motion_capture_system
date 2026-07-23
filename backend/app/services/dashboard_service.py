from datetime import UTC, datetime, timedelta

from app.repositories.contracts import (
    DashboardRepositoryContract,
    MetricSummaryRepositoryContract,
    RecordRepositoryContract,
)
from app.repositories.record_repository import StoredRecord
from app.schemas.auth import CurrentUser
from app.schemas.dashboard import (
    DashboardCounts,
    DashboardMetricTrend,
    DashboardMetricTrendPoint,
    DashboardSummaryResponse,
    DashboardTrendAvailability,
)


RECENT_ACTIVITY_WINDOW_DAYS = 30
TrendKey = tuple[str, str, str, str, str]


class DashboardService:
    def __init__(
        self,
        records: RecordRepositoryContract,
        metric_summaries: MetricSummaryRepositoryContract,
        dashboard: DashboardRepositoryContract | None = None,
    ) -> None:
        self.records = records
        self.metric_summaries = metric_summaries
        self.dashboard = dashboard

    def get_summary(
        self,
        user: CurrentUser,
        *,
        reference_time: datetime | None = None,
    ) -> DashboardSummaryResponse:
        now = reference_time or datetime.now(UTC)
        if self.dashboard is not None:
            return self._from_snapshot(user.userId, now)
        owned_records = self.records.list_owned(user.userId)
        metric_trends, trend_availability = self._build_metric_trends(owned_records)

        return DashboardSummaryResponse(
            counts=self._build_counts(owned_records, now),
            metricTrends=metric_trends,
            trendAvailability=trend_availability,
        )

    def _from_snapshot(self, owner_user_id: str, reference_time: datetime) -> DashboardSummaryResponse:
        snapshot = self.dashboard.get_snapshot(owner_user_id, reference_time)
        grouped: dict[TrendKey, list[DashboardMetricTrendPoint]] = {}
        for row in snapshot.trend_rows:
            key = (
                row.metric_id,
                row.unit,
                row.metric_definition_version,
                row.activity_type,
                row.side,
            )
            grouped.setdefault(key, []).append(
                DashboardMetricTrendPoint(
                    recordId=row.record_id,
                    recordTitle=row.record_title,
                    status="Ready",
                    createdAt=row.created_at.isoformat(),
                    value=row.average,
                ),
            )
        trends = [
            DashboardMetricTrend(
                metricId=key[0], unit=key[1], metricDefinitionVersion=key[2],
                activityType=key[3], side=key[4], statistic="average", points=points,
            )
            for key, points in sorted(grouped.items())
        ]
        return DashboardSummaryResponse(
            counts=DashboardCounts(
                totalRecords=snapshot.total_records,
                readyRecords=snapshot.ready_records,
                failedRecords=snapshot.failed_records,
                recentActivityCount=snapshot.recent_activity_count,
                recentActivityWindowDays=RECENT_ACTIVITY_WINDOW_DAYS,
            ),
            metricTrends=trends,
            trendAvailability=DashboardTrendAvailability(
                readyRecords=snapshot.ready_records,
                recordsWithMetricSummary=snapshot.records_with_summary,
                recordsWithCompatibleMetricSummary=snapshot.records_with_compatible_summary,
            ),
        )

    def _build_counts(
        self,
        records: list[StoredRecord],
        reference_time: datetime,
    ) -> DashboardCounts:
        recent_boundary = reference_time - timedelta(days=RECENT_ACTIVITY_WINDOW_DAYS)

        return DashboardCounts(
            totalRecords=len(records),
            readyRecords=sum(record.status == "Ready" for record in records),
            failedRecords=sum(record.status == "Failed" for record in records),
            recentActivityCount=sum(
                recent_boundary <= record.created_at <= reference_time
                for record in records
            ),
            recentActivityWindowDays=RECENT_ACTIVITY_WINDOW_DAYS,
        )

    def _build_metric_trends(
        self,
        records: list[StoredRecord],
    ) -> tuple[list[DashboardMetricTrend], DashboardTrendAvailability]:
        ready_records = [record for record in records if record.status == "Ready"]
        summaries = self.metric_summaries.get_summaries(
            [record.record_id for record in ready_records],
        )
        grouped_points: dict[TrendKey, list[DashboardMetricTrendPoint]] = {}
        records_with_compatible_summary: set[str] = set()

        for record in ready_records:
            summary = summaries.get(record.record_id)
            if summary is None:
                continue

            for item in summary.items:
                key = self._compatibility_key(item)
                if key is None:
                    continue

                records_with_compatible_summary.add(record.record_id)
                grouped_points.setdefault(key, []).append(
                    DashboardMetricTrendPoint(
                        recordId=record.record_id,
                        recordTitle=record.title,
                        status="Ready",
                        createdAt=record.created_at.isoformat(),
                        value=item.average,
                    ),
                )

        trends = []
        for key in sorted(grouped_points):
            metric_id, unit, metric_version, activity_type, side = key
            points = sorted(grouped_points[key], key=lambda point: point.createdAt)
            trends.append(
                DashboardMetricTrend(
                    metricId=metric_id,
                    unit=unit,
                    metricDefinitionVersion=metric_version,
                    activityType=activity_type,
                    side=side,
                    statistic="average",
                    points=points,
                ),
            )

        return trends, DashboardTrendAvailability(
            readyRecords=len(ready_records),
            recordsWithMetricSummary=len(summaries),
            recordsWithCompatibleMetricSummary=len(records_with_compatible_summary),
        )

    @staticmethod
    def _compatibility_key(item) -> TrendKey | None:
        values = (
            item.metric_id,
            item.unit,
            item.metric_definition_version,
            item.activity_type,
            item.side,
        )
        if not all(values):
            return None

        return values
