import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { deriveDashboardRecordSummary } from "../../features/dashboard";
import type { RecordListItem } from "../../types";
import {
  DashboardContent,
  RecentRecordItem,
  RetryButton,
} from "./DashboardPage";

function renderDashboard(props: {
  isError?: boolean;
  isLoading?: boolean;
  records?: RecordListItem[];
}) {
  const records = props.records ?? [];
  const summary = props.isError || props.isLoading
    ? null
    : deriveDashboardRecordSummary(records, Date.parse("2026-07-17T12:00:00Z"));

  return renderToStaticMarkup(
    <MemoryRouter>
      <DashboardContent
        isError={props.isError ?? false}
        isLoading={props.isLoading ?? false}
        onRetry={() => undefined}
        records={records}
        summary={summary}
      />
    </MemoryRouter>,
  );
}

function createRecord(status: RecordListItem["status"] = "Ready") {
  return {
    recordId: "record with space",
    title: "Latest Session",
    description: "Morning practice",
    thumbnailUrl: null,
    duration: 12.4,
    status,
    tags: ["practice"],
    createdAt: "2026-07-17T00:00:00Z",
  } satisfies RecordListItem;
}

describe("DashboardPage Task 54 states", () => {
  it("keeps Quick Actions visible during a stable loading state", () => {
    const markup = renderDashboard({ isLoading: true });

    expect(markup).toContain('href="/capture"');
    expect(markup).toContain('href="/records"');
    expect(markup).toContain('href="/compare"');
    expect(markup).toContain("Loading recent records");
    expect(markup).toContain("Loading record summary");
    expect(markup).not.toContain("summaryValue");
    expect(markup).not.toContain("No records yet");
  });

  it("renders the empty state with Start Capture", () => {
    const markup = renderDashboard({});

    expect(markup).toContain("No records yet");
    expect(markup).toContain("Start Capture");
    expect(markup).toContain('href="/capture"');
    expect(markup).toContain("Total Records");
    expect(markup).toContain("Ready Records");
    expect(markup).toContain("Failed Records");
    expect(markup).toContain("Recent Activity");
    expect(markup.match(/>0<\/p>/g)).toHaveLength(4);
  });

  it("renders a section-level error and retry without hiding Quick Actions", () => {
    const markup = renderDashboard({ isError: true });

    expect(markup).toContain("Recent records cannot load");
    expect(markup).toContain("Retry");
    expect(markup).toContain("Open Compare");
    expect(markup).toContain("Record summary is unavailable");
    expect(markup).not.toContain("summaryValue");
  });

  it("wires retry to the supplied refetch callback", () => {
    const onRetry = vi.fn();
    const retryButton = RetryButton({ onRetry });

    retryButton.props.onClick();

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders locked Record destinations and action labels", () => {
    const readyMarkup = renderToStaticMarkup(
      <MemoryRouter>
        <RecentRecordItem record={createRecord("Ready")} />
      </MemoryRouter>,
    );
    const uploadingMarkup = renderToStaticMarkup(
      <MemoryRouter>
        <RecentRecordItem record={createRecord("Uploading")} />
      </MemoryRouter>,
    );

    expect(readyMarkup).toContain('href="/records/record%20with%20space"');
    expect(readyMarkup).toContain("Open Viewer");
    expect(uploadingMarkup).toContain("View Record");
  });

  it("renders the four derived Summary Card labels and values", () => {
    const markup = renderDashboard({
      records: [
        createRecord("Ready"),
        { ...createRecord("Failed"), recordId: "record_failed" },
        { ...createRecord("Uploading"), recordId: "record_uploading" },
      ],
    });

    expect(markup).toContain("Total Records");
    expect(markup).toContain(">3</p>");
    expect(markup).toContain("Ready Records");
    expect(markup).toContain("Failed Records");
    expect(markup).toContain("Last 30 days");
  });

  it("does not render Metric Summary or runtime controls", () => {
    const markup = renderDashboard({ records: [createRecord()] });

    expect(markup).not.toContain("Metric Summary");
    expect(markup).not.toContain("VideoPlayer");
    expect(markup).not.toContain("Metric Series");
  });
});
