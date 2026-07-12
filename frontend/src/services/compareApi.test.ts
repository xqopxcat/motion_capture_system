import { describe, expect, it } from "vitest";
import { compareApi } from "./compareApi";

describe("compareApi", () => {
  it("exposes a getCompareData query endpoint", () => {
    expect(compareApi.endpoints.getCompareData).toBeDefined();
  });
});
