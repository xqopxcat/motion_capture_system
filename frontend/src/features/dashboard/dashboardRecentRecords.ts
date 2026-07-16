import type { RecordListItem } from "../../types";
import {
  buildRecordViewerPath,
  getRecordStatusMeta,
  type RecordStatusTone,
} from "../records/recordDisplay";

export const RECENT_RECORD_LIMIT = 5;

export const DASHBOARD_QUICK_ACTIONS = [
  { label: "Start Capture", to: "/capture" },
  { label: "View All Records", to: "/records" },
  { label: "Open Compare", to: "/compare" },
] as const;

type RecentRecordPresentation = {
  actionLabel: "Open Viewer" | "View Record";
  path: string | null;
  statusLabel: string;
  statusTone: RecordStatusTone;
};

export function selectRecentRecords(records: RecordListItem[]) {
  return records.slice(0, RECENT_RECORD_LIMIT);
}

export function getRecentRecordPresentation(
  record: Pick<RecordListItem, "recordId"> & { status: string },
): RecentRecordPresentation {
  const statusMeta = getKnownStatusMeta(record.status);

  return {
    actionLabel: record.status === "Ready" ? "Open Viewer" : "View Record",
    path: buildRecordViewerPath(record.recordId),
    statusLabel: statusMeta?.label ?? (record.status.trim() || "Unknown"),
    statusTone: statusMeta?.tone ?? "neutral",
  };
}

function getKnownStatusMeta(status: string) {
  switch (status) {
    case "Uploading":
    case "Processing":
    case "Ready":
    case "Failed":
      return getRecordStatusMeta(status);
    default:
      return null;
  }
}
