import { describe, expect, it } from "vitest";
import { formatRecordDate, formatRecordDuration, getRecordStatusMeta } from "./recordDisplay";

describe("recordDisplay", () => {
  it("maps record statuses to display tones", () => {
    expect(getRecordStatusMeta("Uploading")).toEqual({
      label: "Uploading",
      tone: "neutral",
    });
    expect(getRecordStatusMeta("Processing")).toEqual({
      label: "Processing",
      tone: "processing",
    });
    expect(getRecordStatusMeta("Ready")).toEqual({
      label: "Ready",
      tone: "ready",
    });
    expect(getRecordStatusMeta("Failed")).toEqual({
      label: "Failed",
      tone: "failed",
    });
  });

  it("formats nullable record durations", () => {
    expect(formatRecordDuration(null)).toBe("Pending");
    expect(formatRecordDuration(12.345)).toBe("12.3s");
  });

  it("keeps invalid record dates readable", () => {
    expect(formatRecordDate("not-a-date")).toBe("not-a-date");
  });
});
