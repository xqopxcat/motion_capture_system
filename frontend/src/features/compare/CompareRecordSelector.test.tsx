import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { RecordListItem } from "../../types";
import { CompareRecordSelector } from "./CompareRecordSelector";

const records: RecordListItem[] = ["left", "right", "third"].map((recordId) => ({
  recordId,
  title: `${recordId} record`,
  description: "",
  thumbnailUrl: null,
  duration: 1,
  status: "Ready",
  tags: [],
  createdAt: "2026-08-31T00:00:00Z",
}));

describe("CompareRecordSelector", () => {
  it("collapses the long available-record list once analysis is ready", () => {
    const html = renderToStaticMarkup(
      <CompareRecordSelector
        analysisReady
        records={records}
        selection={{ leftRecordId: "left", rightRecordId: "right" }}
        showRecordList={false}
        onClearSelection={vi.fn()}
        onSelectRecord={vi.fn()}
        onToggleRecordList={vi.fn()}
      />,
    );

    expect(html).toContain("Selected records");
    expect(html).toContain("Change records");
    expect(html).toContain("left record");
    expect(html).toContain("right record");
    expect(html).not.toContain("Available records");
    expect(html).not.toContain("third record");
  });

  it("shows available records during setup", () => {
    const html = renderToStaticMarkup(
      <CompareRecordSelector
        analysisReady={false}
        records={records}
        selection={{ leftRecordId: null, rightRecordId: null }}
        showRecordList
        onClearSelection={vi.fn()}
        onSelectRecord={vi.fn()}
        onToggleRecordList={vi.fn()}
      />,
    );

    expect(html).toContain("Available records");
    expect(html).toContain("third record");
  });
});
