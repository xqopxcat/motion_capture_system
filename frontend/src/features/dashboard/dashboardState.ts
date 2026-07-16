import type {
  DashboardMetricTrend,
  DashboardTrendAvailability,
  RecordListItem,
} from "../../types";

export type DashboardRecordItem = Omit<RecordListItem, "status"> & {
  status: string;
};

export type DashboardTrendContentState =
  | "no-ready"
  | "no-summary"
  | "no-compatible"
  | "no-history"
  | "single-point"
  | "trend"
  | "unavailable";

export type DashboardIntegrationState = {
  isFullFailure: boolean;
  isInitialLoading: boolean;
  isPartialSuccess: boolean;
};

export function retryFailedDashboardQueries({
  recordsError,
  refetchRecords,
  refetchTrend,
  trendError,
}: {
  recordsError: boolean;
  refetchRecords: () => unknown;
  refetchTrend: () => unknown;
  trendError: boolean;
}) {
  if (recordsError) refetchRecords();
  if (trendError) refetchTrend();
}

export function getDashboardIntegrationState({
  recordsError,
  recordsLoading,
  trendError,
  trendLoading,
}: {
  recordsError: boolean;
  recordsLoading: boolean;
  trendError: boolean;
  trendLoading: boolean;
}): DashboardIntegrationState {
  return {
    isFullFailure: recordsError && trendError,
    isInitialLoading: recordsLoading && trendLoading,
    isPartialSuccess: recordsError !== trendError && !recordsLoading && !trendLoading,
  };
}

export function getDashboardTrendContentState(
  availability: DashboardTrendAvailability | null,
  selectedTrend: DashboardMetricTrend | null,
): DashboardTrendContentState {
  if (!availability) {
    return "unavailable";
  }

  if (availability.readyRecords === 0) {
    return "no-ready";
  }

  if (availability.recordsWithMetricSummary === 0) {
    return "no-summary";
  }

  if (availability.recordsWithCompatibleMetricSummary === 0) {
    return "no-compatible";
  }

  if (!selectedTrend || selectedTrend.points.length === 0) {
    return "no-history";
  }

  return selectedTrend.points.length === 1 ? "single-point" : "trend";
}

export function normalizeDashboardRecords(value: unknown): DashboardRecordItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.flatMap((candidate) => {
    if (!isObject(candidate) || !isNonEmptyString(candidate.recordId)) {
      return [];
    }

    return [{
      recordId: candidate.recordId.trim(),
      title: isNonEmptyString(candidate.title) ? candidate.title.trim() : "Untitled Record",
      description: typeof candidate.description === "string" ? candidate.description : "",
      thumbnailUrl: typeof candidate.thumbnailUrl === "string" ? candidate.thumbnailUrl : null,
      duration: typeof candidate.duration === "number" && Number.isFinite(candidate.duration)
        ? candidate.duration
        : null,
      status: isNonEmptyString(candidate.status) ? candidate.status.trim() : "Unknown",
      tags: Array.isArray(candidate.tags)
        ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : "Unavailable",
    }];
  });
}

export function normalizeDashboardMetricTrends(value: unknown): DashboardMetricTrend[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.flatMap((candidate) => {
    if (
      !isObject(candidate) ||
      !isNonEmptyString(candidate.metricId) ||
      !isNonEmptyString(candidate.unit) ||
      !isNonEmptyString(candidate.metricDefinitionVersion) ||
      !isNonEmptyString(candidate.activityType) ||
      !isNonEmptyString(candidate.side) ||
      candidate.statistic !== "average" ||
      !Array.isArray(candidate.points)
    ) {
      return [];
    }

    const points = candidate.points.flatMap((point) => {
      if (
        !isObject(point) ||
        !isNonEmptyString(point.recordId) ||
        point.status !== "Ready" ||
        typeof point.value !== "number" ||
        !Number.isFinite(point.value) ||
        typeof point.createdAt !== "string" ||
        !Number.isFinite(Date.parse(point.createdAt))
      ) {
        return [];
      }

      return [{
        recordId: point.recordId.trim(),
        recordTitle: isNonEmptyString(point.recordTitle)
          ? point.recordTitle.trim()
          : "Untitled Record",
        status: "Ready" as const,
        createdAt: point.createdAt,
        value: point.value,
      }];
    });

    return [{
      metricId: candidate.metricId.trim(),
      unit: candidate.unit.trim(),
      metricDefinitionVersion: candidate.metricDefinitionVersion.trim(),
      activityType: candidate.activityType.trim(),
      side: candidate.side.trim(),
      statistic: "average" as const,
      points,
    }];
  });
}

export function normalizeTrendAvailability(value: unknown): DashboardTrendAvailability | null {
  if (!isObject(value)) {
    return null;
  }

  const readyRecords = readCount(value.readyRecords);
  const recordsWithMetricSummary = readCount(value.recordsWithMetricSummary);
  const recordsWithCompatibleMetricSummary = readCount(
    value.recordsWithCompatibleMetricSummary,
  );

  if (
    readyRecords === null ||
    recordsWithMetricSummary === null ||
    recordsWithCompatibleMetricSummary === null ||
    recordsWithMetricSummary > readyRecords ||
    recordsWithCompatibleMetricSummary > recordsWithMetricSummary
  ) {
    return null;
  }

  return {
    readyRecords,
    recordsWithMetricSummary,
    recordsWithCompatibleMetricSummary,
  };
}

function readCount(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
