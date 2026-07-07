import type { RecordStatus } from "../../types";

export type RecordStatusTone = "neutral" | "processing" | "ready" | "failed";

export function getRecordStatusMeta(status: RecordStatus) {
  switch (status) {
    case "Ready":
      return {
        label: "Ready",
        tone: "ready" as const,
      };
    case "Failed":
      return {
        label: "Failed",
        tone: "failed" as const,
      };
    case "Processing":
      return {
        label: "Processing",
        tone: "processing" as const,
      };
    case "Uploading":
      return {
        label: "Uploading",
        tone: "neutral" as const,
      };
  }
}

export function formatRecordDuration(duration: number | null) {
  if (duration === null) {
    return "Pending";
  }

  return `${duration.toFixed(1)}s`;
}

export function formatRecordDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
