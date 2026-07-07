import { describe, expect, it } from "vitest";
import { getSafeRedirectTo } from "./redirectIntent";

describe("getSafeRedirectTo", () => {
  it("returns a same-origin route intent", () => {
    const params = new URLSearchParams("redirectTo=/records/record_123");

    expect(getSafeRedirectTo(params)).toBe("/records/record_123");
  });

  it("preserves nested query strings after URLSearchParams decoding", () => {
    const params = new URLSearchParams("redirectTo=%2Fcompare%3Fleft%3Da%26right%3Db");

    expect(getSafeRedirectTo(params)).toBe("/compare?left=a&right=b");
  });

  it("rejects external URLs", () => {
    const params = new URLSearchParams("redirectTo=https://example.com/records");

    expect(getSafeRedirectTo(params)).toBeNull();
  });

  it("rejects protocol-relative URLs", () => {
    const params = new URLSearchParams("redirectTo=//example.com/records");

    expect(getSafeRedirectTo(params)).toBeNull();
  });

  it("rejects backslash paths", () => {
    const params = new URLSearchParams("redirectTo=/records\\bad");

    expect(getSafeRedirectTo(params)).toBeNull();
  });
});
