import { describe, expect, it } from "vitest";
import type { RecordListItem } from "../../types";
import { deriveDashboardRecordSummary } from "./dashboardRecordSummary";

const REFERENCE_TIME = Date.parse("2026-07-17T12:00:00.000Z");

function createRecord(
  status: string,
  createdAt = "2026-07-17T00:00:00.000Z",
): Pick<RecordListItem, "status" | "createdAt"> {
  return { status, createdAt } as Pick<RecordListItem, "status" | "createdAt">;
}

describe("deriveDashboardRecordSummary", () => {
  it("returns zero for every value for an empty Record list", () => {
    expect(deriveDashboardRecordSummary([], REFERENCE_TIME)).toEqual({
      totalRecords: 0,
      readyRecords: 0,
      failedRecords: 0,
      recentActivityCount: 0,
      recentActivityWindowDays: 30,
    });
  });

  it("counts all canonical statuses in Total Records", () => {
    const records = ["Uploading", "Processing", "Ready", "Failed"].map((status) =>
      createRecord(status),
    );

    expect(deriveDashboardRecordSummary(records, REFERENCE_TIME)).toMatchObject({
      totalRecords: 4,
      readyRecords: 1,
      failedRecords: 1,
    });
  });

  it("includes an unknown future status only in Total Records", () => {
    const summary = deriveDashboardRecordSummary(
      [createRecord("Archived", "2026-05-01T00:00:00.000Z")],
      REFERENCE_TIME,
    );

    expect(summary).toMatchObject({
      totalRecords: 1,
      readyRecords: 0,
      failedRecords: 0,
      recentActivityCount: 0,
    });
  });

  it("counts only exact Ready and Failed statuses", () => {
    const records = [
      createRecord("Ready"),
      createRecord("ready"),
      createRecord("Failed"),
      createRecord("failed"),
      createRecord("Uploading"),
      createRecord("Processing"),
    ];

    expect(deriveDashboardRecordSummary(records, REFERENCE_TIME)).toMatchObject({
      readyRecords: 1,
      failedRecords: 1,
    });
  });

  it("counts Records inside the rolling trailing 30-day window", () => {
    const records = [
      createRecord("Ready", "2026-07-17T12:00:00.000Z"),
      createRecord("Ready", "2026-07-01T00:00:00.000Z"),
      createRecord("Ready", "2026-06-18T12:00:00.000Z"),
    ];

    expect(deriveDashboardRecordSummary(records, REFERENCE_TIME).recentActivityCount).toBe(3);
  });

  it("includes a Record exactly on the 30-day boundary", () => {
    const records = [createRecord("Ready", "2026-06-17T12:00:00.000Z")];

    expect(deriveDashboardRecordSummary(records, REFERENCE_TIME).recentActivityCount).toBe(1);
  });

  it("excludes a Record older than the 30-day boundary", () => {
    const records = [createRecord("Ready", "2026-06-17T11:59:59.999Z")];

    expect(deriveDashboardRecordSummary(records, REFERENCE_TIME).recentActivityCount).toBe(0);
  });

  it("excludes future-dated Records from trailing activity", () => {
    const records = [createRecord("Ready", "2026-07-17T12:00:00.001Z")];

    expect(deriveDashboardRecordSummary(records, REFERENCE_TIME).recentActivityCount).toBe(0);
  });

  it("ignores an invalid createdAt without crashing", () => {
    const records = [createRecord("Ready", "not-a-date")];

    expect(deriveDashboardRecordSummary(records, REFERENCE_TIME)).toMatchObject({
      totalRecords: 1,
      readyRecords: 1,
      recentActivityCount: 0,
    });
  });

  it("does not mutate the input array", () => {
    const records = Object.freeze([
      Object.freeze(createRecord("Ready", "2026-07-10T00:00:00.000Z")),
      Object.freeze(createRecord("Failed", "2026-07-01T00:00:00.000Z")),
    ]);
    const originalOrder = records.map((record) => record.status);

    deriveDashboardRecordSummary(records, REFERENCE_TIME);

    expect(records.map((record) => record.status)).toEqual(originalOrder);
  });
});
