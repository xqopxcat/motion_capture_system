import { describe, expect, it } from "vitest";
import type { RecordListItem } from "../../types";
import {
  canSelectCompareRecord,
  findCompareRecord,
  getCompareSelectionValidationMessages,
} from "./compareSelection";

function createRecord(recordId: string, status: RecordListItem["status"] = "Ready"): RecordListItem {
  return {
    createdAt: "2026-07-01T00:00:00.000Z",
    description: `${recordId} description`,
    duration: 10,
    recordId,
    status,
    tags: [],
    thumbnailUrl: null,
    title: `${recordId} title`,
  };
}

describe("compareSelection", () => {
  const records = [
    createRecord("record_left"),
    createRecord("record_right"),
    createRecord("record_processing", "Processing"),
    createRecord("record_failed", "Failed"),
  ];

  it("finds selected records and reports missing selected ids", () => {
    expect(findCompareRecord(records, "record_left")?.recordId).toBe("record_left");
    expect(findCompareRecord(records, "missing_record")).toBeUndefined();

    expect(
      getCompareSelectionValidationMessages(
        { leftRecordId: "missing_left", rightRecordId: "missing_right" },
        records,
      ),
    ).toEqual([
      'Left Record "missing_left" was not found.',
      'Right Record "missing_right" was not found.',
    ]);
  });

  it("allows distinct Ready records on left and right", () => {
    expect(
      getCompareSelectionValidationMessages(
        { leftRecordId: "record_left", rightRecordId: "record_right" },
        records,
      ),
    ).toEqual([]);

    expect(
      canSelectCompareRecord({
        records,
        recordId: "record_left",
        selection: { leftRecordId: null, rightRecordId: "record_right" },
        side: "left",
      }),
    ).toBe(true);
  });

  it("prevents selecting the same record on both sides", () => {
    expect(
      getCompareSelectionValidationMessages(
        { leftRecordId: "record_left", rightRecordId: "record_left" },
        records,
      ),
    ).toEqual(["Left and right cannot use the same Record."]);

    expect(
      canSelectCompareRecord({
        records,
        recordId: "record_left",
        selection: { leftRecordId: null, rightRecordId: "record_left" },
        side: "left",
      }),
    ).toBe(false);
  });

  it("rejects non-Ready records", () => {
    expect(
      getCompareSelectionValidationMessages(
        { leftRecordId: "record_processing", rightRecordId: "record_failed" },
        records,
      ),
    ).toEqual([
      'Left Record "record_processing title" is Processing, not Ready.',
      'Right Record "record_failed title" is Failed, not Ready.',
    ]);

    expect(
      canSelectCompareRecord({
        records,
        recordId: "record_processing",
        selection: { leftRecordId: null, rightRecordId: null },
        side: "left",
      }),
    ).toBe(false);
  });
});
