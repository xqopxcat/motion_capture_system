import { describe, expect, it } from "vitest";
import {
  mapCompareSelectionToApiParams,
  parseCompareRouteSelection,
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
});
