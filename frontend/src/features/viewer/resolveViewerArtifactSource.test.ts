import { describe, expect, it } from "vitest";
import { resolveViewerArtifactSource } from "./resolveViewerArtifactSource";

describe("resolveViewerArtifactSource", () => {
  it("returns an error state when the record id is missing", () => {
    const state = resolveViewerArtifactSource({});

    expect(state.status).toBe("error");
    expect(state.errorMessage).toBe("Viewer route is missing a record id.");
  });

  it("returns a local ready fixture for the local demo record", () => {
    const state = resolveViewerArtifactSource({ recordId: "local-demo" });

    expect(state.status).toBe("ready");
    expect(state.videoSrc).toBeTruthy();
    expect(state.poseDataset?.frameCount).toBe(2);
    expect(state.poseDataset?.frames[0].landmarks2D).toHaveLength(33);
  });

  it("returns a missing state when no local or exported artifacts are available", () => {
    const state = resolveViewerArtifactSource({ recordId: "record_123" });

    expect(state.status).toBe("missing");
    expect(state.videoSrc).toBeNull();
    expect(state.poseDataset).toBeNull();
  });

  it("can resolve an exported video URL with the local pose fixture boundary", () => {
    const searchParams = new URLSearchParams({
      poseFixture: "local-demo",
      videoUrl: "blob:http://localhost/video",
    });

    const state = resolveViewerArtifactSource({ recordId: "record_123", searchParams });

    expect(state.status).toBe("ready");
    expect(state.videoSrc).toBe("blob:http://localhost/video");
    expect(state.poseDataset?.frameCount).toBe(2);
  });
});
