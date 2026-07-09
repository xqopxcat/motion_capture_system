import { describe, expect, it } from "vitest";
import { annotationsApi } from "./annotationsApi";

describe("annotationsApi", () => {
  it("exposes a getAnnotations query endpoint", () => {
    expect(annotationsApi.endpoints.getAnnotations).toBeDefined();
  });

  it("exposes a createAnnotation mutation endpoint", () => {
    expect(annotationsApi.endpoints.createAnnotation).toBeDefined();
  });
});
