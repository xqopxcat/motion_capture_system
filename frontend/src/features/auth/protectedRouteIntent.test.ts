import { describe, expect, it } from "vitest";
import { getLoginRedirect, getProtectedRouteState } from "./protectedRouteIntent";

describe("getProtectedRouteState", () => {
  it("keeps protected content pending while current user loads", () => {
    expect(getProtectedRouteState(false, true)).toBe("loading");
  });

  it("allows an authenticated current user", () => {
    expect(getProtectedRouteState(true, false)).toBe("authenticated");
  });

  it("rejects a request without a current user", () => {
    expect(getProtectedRouteState(false, false)).toBe("unauthenticated");
  });
});

describe("getLoginRedirect", () => {
  it("preserves a records path", () => {
    expect(getLoginRedirect("/records", "")).toBe(
      "/login?redirectTo=%2Frecords",
    );
  });

  it("preserves a record detail path and query string", () => {
    expect(getLoginRedirect("/records/record_123", "?tab=metrics")).toBe(
      "/login?redirectTo=%2Frecords%2Frecord_123%3Ftab%3Dmetrics",
    );
  });

  it("falls back when given an external target", () => {
    expect(getLoginRedirect("https://example.com/records", "")).toBe(
      "/login?redirectTo=%2Fdashboard",
    );
  });
});
