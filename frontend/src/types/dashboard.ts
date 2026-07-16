export type DashboardCounts = {
  totalRecords: number;
  readyRecords: number;
  failedRecords: number;
  recentActivityCount: number;
  recentActivityWindowDays: 30;
};

export type DashboardMetricTrendPoint = {
  recordId: string;
  recordTitle: string;
  createdAt: string;
  value: number;
};

export type DashboardMetricTrend = {
  metricId: string;
  unit: string;
  metricDefinitionVersion: string;
  activityType: string;
  side: string;
  statistic: "average";
  points: DashboardMetricTrendPoint[];
};

export type DashboardSummaryResponse = {
  counts: DashboardCounts;
  metricTrends: DashboardMetricTrend[];
};
