import type { DashboardRecordItem } from "./dashboardState";

export const RECENT_ACTIVITY_WINDOW_DAYS = 30 as const;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type DashboardRecordSummary = {
  totalRecords: number;
  readyRecords: number;
  failedRecords: number;
  recentActivityCount: number;
  recentActivityWindowDays: typeof RECENT_ACTIVITY_WINDOW_DAYS;
};

export function deriveDashboardRecordSummary(
  records: ReadonlyArray<Pick<DashboardRecordItem, "status" | "createdAt">>,
  referenceTime: number,
): DashboardRecordSummary {
  const recentBoundary = referenceTime - RECENT_ACTIVITY_WINDOW_DAYS * DAY_IN_MILLISECONDS;
  let readyRecords = 0;
  let failedRecords = 0;
  let recentActivityCount = 0;

  for (const record of records) {
    if (record.status === "Ready") {
      readyRecords += 1;
    } else if (record.status === "Failed") {
      failedRecords += 1;
    }

    const createdAt = Date.parse(record.createdAt);
    if (
      Number.isFinite(createdAt) &&
      createdAt >= recentBoundary &&
      createdAt <= referenceTime
    ) {
      recentActivityCount += 1;
    }
  }

  return {
    totalRecords: records.length,
    readyRecords,
    failedRecords,
    recentActivityCount,
    recentActivityWindowDays: RECENT_ACTIVITY_WINDOW_DAYS,
  };
}
