import { describe, expect, it } from "vitest";
import {
  mapCompareSelectionToApiParams,
  parseCompareRouteSelection,
  updateCompareRouteSelectionParam,
} from "./compareRouteParams";

describe("compare route params", () => {
  it("returns empty selection when query params are missing", () => {
    expect(parseCompareRouteSelection(new URLSearchParams())).toEqual({
      leftRecordId: null,
      rightRecordId: null,
    });
  });

  it("parses left and right route params", () => {
    expect(
      parseCompareRouteSelection(
        new URLSearchParams("left=record_a&right=record_b"),
      ),
    ).toEqual({
      leftRecordId: "record_a",
      rightRecordId: "record_b",
    });
  });

  it("maps frontend left and right params to backend recordA and recordB params", () => {
    expect(
      mapCompareSelectionToApiParams({
        leftRecordId: "record_a",
        rightRecordId: "record_b",
      }),
    ).toEqual({
      recordA: "record_a",
      recordB: "record_b",
    });
  });

  it("does not create API params until both records are present", () => {
    expect(
      mapCompareSelectionToApiParams({
        leftRecordId: "record_a",
        rightRecordId: null,
      }),
    ).toBeNull();
  });

  it("updates one side while preserving unrelated query params", () => {
    const searchParams = updateCompareRouteSelectionParam(
      new URLSearchParams("tab=records&right=record_b"),
      "left",
      "record_a",
    );

    expect(searchParams.toString()).toBe("tab=records&right=record_b&left=record_a");
  });

  it("removes one side when the next record id is empty", () => {
    const searchParams = updateCompareRouteSelectionParam(
      new URLSearchParams("left=record_a&right=record_b"),
      "left",
      null,
    );

    expect(searchParams.toString()).toBe("right=record_b");
  });
});
