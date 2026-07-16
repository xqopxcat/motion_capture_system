import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { deriveDashboardRecordSummary } from "../../features/dashboard";
import type { DashboardMetricTrend, RecordListItem } from "../../types";
import {
  DashboardContent,
  MetricSummaryTrendSection,
  RecentRecordItem,
  RetryButton,
} from "./DashboardPage";

function renderDashboard(props: {
  isError?: boolean;
  isLoading?: boolean;
  records?: RecordListItem[];
  trendIsError?: boolean;
  trendIsLoading?: boolean;
  trends?: DashboardMetricTrend[];
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
        trends={props.trends ?? []}
        isTrendError={props.trendIsError ?? false}
        isTrendLoading={props.trendIsLoading ?? false}
        onTrendRetry={() => undefined}
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

function createTrend(pointCount = 2, side = "left"): DashboardMetricTrend {
  return {
    metricId: "knee_flexion",
    unit: "degree",
    metricDefinitionVersion: "knee-flexion.v1",
    activityType: "squat",
    side,
    statistic: "average",
    points: Array.from({ length: pointCount }, (_, index) => ({
      recordId: `trend_record_${side}_${index}`,
      recordTitle: `Trend Record ${index + 1}`,
      status: "Ready",
      createdAt: `2026-07-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
      value: 70 + index * 5,
    })),
  };
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

  it("does not render runtime controls", () => {
    const markup = renderDashboard({ records: [createRecord()] });

    expect(markup).not.toContain("VideoPlayer");
    expect(markup).not.toContain("Metric Series");
  });
});

describe("DashboardPage Task 56 Metric Summary Trend", () => {
  it("renders an independent stable Trend loading state", () => {
    const markup = renderDashboard({ trendIsLoading: true });

    expect(markup).toContain("Loading Metric Summary trend");
    expect(markup).toContain("Quick Actions");
    expect(markup).toContain("No records yet");
  });

  it("renders section-level Trend error and retry without hiding Record sections", () => {
    const markup = renderDashboard({ trendIsError: true });

    expect(markup).toContain("Metric trend cannot load");
    expect(markup).toContain("Retry trend");
    expect(markup).toContain("No records yet");
  });

  it("renders the no-compatible-series empty state", () => {
    const markup = renderDashboard({});

    expect(markup).toContain("No compatible metric history");
  });

  it("renders a single point without implying a direction", () => {
    const markup = renderDashboard({ trends: [createTrend(1)] });

    expect(markup).not.toContain(">75 <");
    expect(markup).toContain("70");
    expect(markup).toContain("One compatible Record is available");
    expect(markup).not.toContain("trendLine");
    expect(markup).toContain('href="/records/trend_record_left_0"');
  });

  it("renders a labeled SVG trend and Viewer links for two points", () => {
    const markup = renderDashboard({ trends: [createTrend(2)] });

    expect(markup).toContain("knee_flexion average history in degree");
    expect(markup).toContain("2 compatible Ready Records");
    expect(markup).toContain('href="/records/trend_record_left_0"');
    expect(markup).toContain("Trend Record 1");
    expect(markup).toContain("Average · degree");
  });

  it("renders a fixed compatibility-series selector when multiple series exist", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <MetricSummaryTrendSection
          isError={false}
          isLoading={false}
          onRetry={() => undefined}
          trends={[createTrend(2, "left"), createTrend(2, "right")]}
        />
      </MemoryRouter>,
    );

    expect(markup).toContain("Metric series");
    expect(markup).toContain("knee_flexion — squat / left — degree");
    expect(markup).toContain("knee_flexion — squat / right — degree");
  });
});
