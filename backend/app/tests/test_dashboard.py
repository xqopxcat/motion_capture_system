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
    assert set(body) == {"counts", "metricTrends"}
    assert body["counts"]["recentActivityWindowDays"] == 30
    assert isinstance(body["metricTrends"], list)


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
