from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.main import app
from app.repositories.metric_summary_repository import (
    MetricSummaryItemRecord,
    MetricSummaryRepository,
)
from app.repositories.record_repository import RecordRepository
from app.schemas.auth import CurrentUser
from app.schemas.record import CreateRecordRequest
from app.services.dashboard_service import DashboardService


REFERENCE_TIME = datetime(2026, 7, 17, 12, 0, tzinfo=UTC)


def test_dashboard_summary_requires_authentication() -> None:
    response = TestClient(app).get("/api/dashboard/summary")

    assert response.status_code == 401


def test_dashboard_summary_api_returns_owned_contract() -> None:
    client = TestClient(app)
    assert client.post("/api/auth/mock-login", json={"provider": "google"}).status_code == 200

    response = client.get("/api/dashboard/summary")
    body = response.json()

    assert response.status_code == 200
    assert set(body) == {"counts", "metricTrends", "trendAvailability"}
    assert body["counts"]["recentActivityWindowDays"] == 30
    assert isinstance(body["metricTrends"], list)
    serialized = response.text.lower()
    assert "videourl" not in serialized
    assert "poseurl" not in serialized
    assert "seriesurl" not in serialized
    assert "storagepath" not in serialized


def test_dashboard_service_groups_only_fully_compatible_ready_summaries() -> None:
    records = RecordRepository()
    summaries = MetricSummaryRepository()
    user = _user("owner")

    first_id = _create_record(records, user, "First", "Ready")
    second_id = _create_record(records, user, "Second", "Ready")
    incomplete_id = _create_record(records, user, "Legacy", "Ready")
    processing_id = _create_record(records, user, "Processing", "Processing")

    summaries.persist_summary(
        record_id=first_id,
        items=[_summary(average=70)],
    )
    summaries.persist_summary(
        record_id=second_id,
        items=[_summary(average=80)],
    )
    summaries.persist_summary(
        record_id=incomplete_id,
        items=[_summary(average=90, unit=None)],
    )
    summaries.persist_summary(
        record_id=processing_id,
        items=[_summary(average=100)],
    )

    response = DashboardService(records, summaries).get_summary(
        user,
        reference_time=REFERENCE_TIME,
    )

    assert response.counts.totalRecords == 4
    assert response.counts.readyRecords == 3
    assert len(response.metricTrends) == 1
    trend = response.metricTrends[0]
    assert trend.metricId == "knee_flexion"
    assert trend.unit == "degree"
    assert trend.metricDefinitionVersion == "knee-flexion.v1"
    assert trend.activityType == "squat"
    assert trend.side == "left"
    assert trend.statistic == "average"
    assert all(point.status == "Ready" for point in trend.points)
    assert [point.value for point in trend.points] == [70, 80]
    assert response.trendAvailability.readyRecords == 3
    assert response.trendAvailability.recordsWithMetricSummary == 3
    assert response.trendAvailability.recordsWithCompatibleMetricSummary == 2


def test_dashboard_service_separates_incompatible_units_versions_activities_and_sides() -> None:
    records = RecordRepository()
    summaries = MetricSummaryRepository()
    user = _user("owner")
    variants = [
        _summary(average=1),
        _summary(average=2, unit="radian"),
        _summary(average=3, metric_version="knee-flexion.v2"),
        _summary(average=4, activity_type="lunge"),
        _summary(average=5, side="right"),
    ]

    for index, item in enumerate(variants):
        record_id = _create_record(records, user, f"Variant {index}", "Ready")
        summaries.persist_summary(record_id=record_id, items=[item])

    response = DashboardService(records, summaries).get_summary(
        user,
        reference_time=REFERENCE_TIME,
    )

    assert len(response.metricTrends) == 5
    assert sum(len(trend.points) for trend in response.metricTrends) == 5
    assert response.trendAvailability.recordsWithCompatibleMetricSummary == 5


def test_dashboard_service_never_includes_another_users_records_or_metrics() -> None:
    records = RecordRepository()
    summaries = MetricSummaryRepository()
    owner = _user("owner")
    other = _user("other")
    owner_id = _create_record(records, owner, "Owner", "Ready")
    other_id = _create_record(records, other, "Other", "Ready")
    summaries.persist_summary(record_id=owner_id, items=[_summary(average=70)])
    summaries.persist_summary(record_id=other_id, items=[_summary(average=999)])

    response = DashboardService(records, summaries).get_summary(
        owner,
        reference_time=REFERENCE_TIME,
    )

    assert response.counts.totalRecords == 1
    assert [point.recordId for trend in response.metricTrends for point in trend.points] == [owner_id]
    assert response.trendAvailability.readyRecords == 1
    assert response.trendAvailability.recordsWithMetricSummary == 1
    assert response.trendAvailability.recordsWithCompatibleMetricSummary == 1


def test_trend_availability_distinguishes_no_ready_no_summary_and_incompatible_summary() -> None:
    records = RecordRepository()
    summaries = MetricSummaryRepository()
    user = _user("owner")
    service = DashboardService(records, summaries)

    _create_record(records, user, "Uploading", "Uploading")
    no_ready = service.get_summary(user, reference_time=REFERENCE_TIME)
    assert no_ready.trendAvailability.model_dump() == {
        "readyRecords": 0,
        "recordsWithMetricSummary": 0,
        "recordsWithCompatibleMetricSummary": 0,
    }

    ready_without_summary = _create_record(records, user, "Ready no summary", "Ready")
    no_summary = service.get_summary(user, reference_time=REFERENCE_TIME)
    assert no_summary.trendAvailability.model_dump() == {
        "readyRecords": 1,
        "recordsWithMetricSummary": 0,
        "recordsWithCompatibleMetricSummary": 0,
    }

    summaries.persist_summary(
        record_id=ready_without_summary,
        items=[_summary(average=70, unit=None)],
    )
    incompatible = service.get_summary(user, reference_time=REFERENCE_TIME)
    assert incompatible.trendAvailability.model_dump() == {
        "readyRecords": 1,
        "recordsWithMetricSummary": 1,
        "recordsWithCompatibleMetricSummary": 0,
    }


def test_trend_availability_counts_a_record_once_when_it_has_multiple_metrics() -> None:
    records = RecordRepository()
    summaries = MetricSummaryRepository()
    user = _user("owner")
    record_id = _create_record(records, user, "Multiple metrics", "Ready")
    second_metric = _summary(average=40)
    second_metric = MetricSummaryItemRecord(
        metric_id="hip_flexion",
        unit=second_metric.unit,
        metric_definition_version="hip-flexion.v1",
        activity_type=second_metric.activity_type,
        side=second_metric.side,
        min=20,
        max=80,
        average=40,
        range_of_motion=60,
    )
    summaries.persist_summary(
        record_id=record_id,
        items=[_summary(average=70), second_metric],
    )

    response = DashboardService(records, summaries).get_summary(
        user,
        reference_time=REFERENCE_TIME,
    )

    assert len(response.metricTrends) == 2
    assert response.trendAvailability.recordsWithMetricSummary == 1
    assert response.trendAvailability.recordsWithCompatibleMetricSummary == 1


def _user(user_id: str) -> CurrentUser:
    return CurrentUser(
        userId=user_id,
        email=f"{user_id}@example.com",
        displayName=user_id,
        provider="dev",
    )


def _create_record(
    repository: RecordRepository,
    user: CurrentUser,
    title: str,
    status: str,
) -> str:
    created = repository.create(
        CreateRecordRequest(title=title, description="", tags=[]),
        owner_user_id=user.userId,
    )
    repository.update_status(created.recordId, status)
    return created.recordId


def _summary(
    *,
    average: float,
    unit: str | None = "degree",
    metric_version: str | None = "knee-flexion.v1",
    activity_type: str | None = "squat",
    side: str | None = "left",
) -> MetricSummaryItemRecord:
    return MetricSummaryItemRecord(
        metric_id="knee_flexion",
        unit=unit,
        metric_definition_version=metric_version,
        activity_type=activity_type,
        side=side,
        min=30,
        max=120,
        average=average,
        range_of_motion=90,
    )
