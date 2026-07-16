from typing import Literal

from pydantic import BaseModel, Field


class DashboardCounts(BaseModel):
    totalRecords: int = Field(ge=0)
    readyRecords: int = Field(ge=0)
    failedRecords: int = Field(ge=0)
    recentActivityCount: int = Field(ge=0)
    recentActivityWindowDays: Literal[30]


class DashboardMetricTrendPoint(BaseModel):
    recordId: str
    recordTitle: str
    createdAt: str
    value: float


class DashboardMetricTrend(BaseModel):
    metricId: str
    unit: str
    metricDefinitionVersion: str
    activityType: str
    side: str
    statistic: Literal["average"]
    points: list[DashboardMetricTrendPoint] = Field(default_factory=list)


class DashboardSummaryResponse(BaseModel):
    counts: DashboardCounts
    metricTrends: list[DashboardMetricTrend] = Field(default_factory=list)
