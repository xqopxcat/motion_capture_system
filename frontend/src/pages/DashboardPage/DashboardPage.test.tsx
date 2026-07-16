import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { deriveDashboardRecordSummary } from "../../features/dashboard";
import type { DashboardMetricTrend, DashboardTrendAvailability, RecordListItem } from "../../types";
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
  trendAvailability?: DashboardTrendAvailability;
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
        isRetrying={false}
        isFullFailure={Boolean(props.isError && props.trendIsError)}
        onFullRetry={() => undefined}
        onRetry={() => undefined}
        records={records}
        summary={summary}
        trends={props.trends ?? []}
        trendAvailability={props.trendAvailability ?? {
          readyRecords: props.trends?.length ? 1 : 0,
          recordsWithMetricSummary: props.trends?.length ? 1 : 0,
          recordsWithCompatibleMetricSummary: props.trends?.length ? 1 : 0,
        }}
        isTrendError={props.trendIsError ?? false}
        isTrendLoading={props.trendIsLoading ?? false}
        isTrendRetrying={false}
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

    expect(markup).toContain("No Ready Records");
  });

  it.each([
    [{ readyRecords: 0, recordsWithMetricSummary: 0, recordsWithCompatibleMetricSummary: 0 }, "No Ready Records"],
    [{ readyRecords: 2, recordsWithMetricSummary: 0, recordsWithCompatibleMetricSummary: 0 }, "No Metric Summary"],
    [{ readyRecords: 2, recordsWithMetricSummary: 1, recordsWithCompatibleMetricSummary: 0 }, "No Compatible Metric Summary"],
  ] satisfies Array<[DashboardTrendAvailability, string]>) (
    "uses trendAvailability for the locked empty state %#",
    (trendAvailability, expected) => {
      expect(renderDashboard({ trendAvailability })).toContain(expected);
    },
  );

  it("does not fall back to No Metric Summary when a selected compatible series has no points", () => {
    const markup = renderDashboard({
      trends: [createTrend(0)],
      trendAvailability: {
        readyRecords: 2,
        recordsWithMetricSummary: 2,
        recordsWithCompatibleMetricSummary: 1,
      },
    });

    expect(markup).toContain("No compatible history for this metric");
    expect(markup).not.toContain("<h3>No Metric Summary</h3>");
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
          availability={{
            readyRecords: 1,
            recordsWithMetricSummary: 1,
            recordsWithCompatibleMetricSummary: 1,
          }}
          isError={false}
          isLoading={false}
          isRetrying={false}
          onRetry={() => undefined}
          showRetry
          trends={[createTrend(2, "left"), createTrend(2, "right")]}
        />
      </MemoryRouter>,
    );

    expect(markup).toContain("Metric series");
    expect(markup).toContain("knee_flexion — squat / left — degree");
    expect(markup).toContain("knee_flexion — squat / right — degree");
  });
});

describe("DashboardPage Task 57 integrated failures", () => {
  it("keeps trend content usable when Records fail", () => {
    const markup = renderDashboard({ isError: true, trends: [createTrend(2)] });

    expect(markup).toContain("Recent records cannot load");
    expect(markup).toContain("knee_flexion average history");
    expect(markup).not.toContain("Dashboard data cannot load");
  });

  it("keeps Record sections usable when Trend fails", () => {
    const markup = renderDashboard({ records: [createRecord()], trendIsError: true });

    expect(markup).toContain("Latest Session");
    expect(markup).toContain("Metric trend cannot load");
    expect(markup).not.toContain("Dashboard data cannot load");
  });

  it("shows one full-dashboard retry while preserving section context", () => {
    const markup = renderDashboard({ isError: true, trendIsError: true });

    expect(markup).toContain("Dashboard data cannot load");
    expect(markup).toContain("Retry Dashboard");
    expect(markup).toContain("Recent records cannot load");
    expect(markup).toContain("Metric trend cannot load");
    expect(markup.match(/<button/g)).toHaveLength(1);
  });

  it("disables a retry while the request is in progress", () => {
    const button = RetryButton({ isRetrying: true, onRetry: () => undefined });
    expect(button.props.disabled).toBe(true);
    expect(button.props.children).toBe("Retrying…");
  });
});
