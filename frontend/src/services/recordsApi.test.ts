import { describe, expect, it } from "vitest";
import { recordsApi } from "./recordsApi";

describe("recordsApi", () => {
  it("exposes a createRecord mutation endpoint", () => {
    expect(recordsApi.endpoints.createRecord).toBeDefined();
  });

  it("exposes a finalizeRecord mutation endpoint", () => {
    expect(recordsApi.endpoints.finalizeRecord).toBeDefined();
  });
});
