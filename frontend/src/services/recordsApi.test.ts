import { describe, expect, it } from "vitest";
import { recordsApi } from "./recordsApi";

describe("recordsApi", () => {
  it("exposes a createRecord mutation endpoint", () => {
    expect(recordsApi.endpoints.createRecord).toBeDefined();
  });
});
