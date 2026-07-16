import { describe, expect, it } from "vitest";
import type { RecordListItem } from "../../types";
import {
  DASHBOARD_QUICK_ACTIONS,
  getRecentRecordPresentation,
  selectRecentRecords,
} from "./dashboardRecentRecords";

function createRecord(index: number, status: RecordListItem["status"] = "Ready") {
  return {
    recordId: `record_${index}`,
    title: `Record ${index}`,
    description: "",
    thumbnailUrl: null,
    duration: null,
    status,
    tags: [],
    createdAt: `2026-07-${String(17 - index).padStart(2, "0")}T00:00:00Z`,
  } satisfies RecordListItem;
}

describe("dashboardRecentRecords", () => {
  it("selects only the first five records and preserves newest-first input order", () => {
    const records = Array.from({ length: 7 }, (_, index) => createRecord(index));

    expect(selectRecentRecords(records).map((record) => record.recordId)).toEqual([
      "record_0",
      "record_1",
      "record_2",
      "record_3",
      "record_4",
    ]);
  });

  it.each([
    ["Ready", "Open Viewer", "ready"],
    ["Uploading", "View Record", "neutral"],
    ["Processing", "View Record", "processing"],
    ["Failed", "View Record", "failed"],
  ] as const)("maps %s to its locked action", (status, actionLabel, statusTone) => {
    expect(getRecentRecordPresentation(createRecord(1, status))).toMatchObject({
      actionLabel,
      path: "/records/record_1",
      statusLabel: status,
      statusTone,
    });
  });

  it("treats an unknown status as neutral and never as Ready", () => {
    expect(
      getRecentRecordPresentation({ recordId: "record_unknown", status: "Archived" }),
    ).toEqual({
      actionLabel: "View Record",
      path: "/records/record_unknown",
      statusLabel: "Archived",
      statusTone: "neutral",
    });
  });

  it("locks Quick Actions to existing routes", () => {
    expect(DASHBOARD_QUICK_ACTIONS).toEqual([
      { label: "Start Capture", to: "/capture" },
      { label: "View All Records", to: "/records" },
      { label: "Open Compare", to: "/compare" },
    ]);
  });
});
