import { describe, expect, it } from "vitest";
import { authApi } from "./authApi";

describe("authApi", () => {
  it("exposes a mockLogin mutation endpoint", () => {
    expect(authApi.endpoints.mockLogin).toBeDefined();
  });
});
