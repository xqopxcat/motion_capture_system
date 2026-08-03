import { describe, expect, it, vi } from "vitest";
import { PRODUCTION_SKELETON_PROFILE } from "./productionSkeletonProfile";
import {
  getProductionLandmarkOpacity,
  getProductionSkeletonDisplayScale,
  projectProductionSkeletonPoint,
  renderProductionSkeleton,
  syncProductionCanvasSize,
} from "./renderProductionSkeleton";

function landmark(id: number, visibility = 0.9, x = 0.5, y = 0.5, presence?: number) {
  return { id, visibility, x, y, ...(presence === undefined ? {} : { presence }) };
}

function canvas(width = 200, height = 100, cssWidth = 200) {
  return {
    width,
    height,
    getBoundingClientRect: () => ({ width: cssWidth, height: cssWidth / 2 }),
  } as unknown as HTMLCanvasElement;
}

function context() {
  const opacityValues: number[] = [];
  const value = {
    arc: vi.fn(), beginPath: vi.fn(), clearRect: vi.fn(), fill: vi.fn(), fillRect: vi.fn(),
    lineTo: vi.fn(), moveTo: vi.fn(), restore: vi.fn(), save: vi.fn(), setLineDash: vi.fn(),
    stroke: vi.fn(),
    set globalAlpha(opacity: number) { opacityValues.push(opacity); },
    get globalAlpha() { return opacityValues.at(-1) ?? 1; },
    opacityValues,
  };
  return value as typeof value & CanvasRenderingContext2D;
}

describe("production skeleton confidence policy", () => {
  it("renders high confidence, reduces medium confidence, and hides low confidence", () => {
    expect(getProductionLandmarkOpacity(landmark(11, 0.9))).toBe(PRODUCTION_SKELETON_PROFILE.activeOpacity);
    expect(getProductionLandmarkOpacity(landmark(11, 0.5))).toBe(PRODUCTION_SKELETON_PROFILE.mediumConfidenceOpacity);
    expect(getProductionLandmarkOpacity(landmark(11, 0.2))).toBeNull();
    expect(getProductionLandmarkOpacity(landmark(11, 0.9, 0.5, 0.5, 0.2))).toBeNull();
  });

  it("hides invalid and unreasonable normalized coordinates", () => {
    expect(getProductionLandmarkOpacity(landmark(11, 0.9, Number.NaN))).toBeNull();
    expect(getProductionLandmarkOpacity(landmark(11, 0.9, 2))).toBeNull();
  });

  it("hides a connection when either endpoint fails confidence", () => {
    const target = canvas();
    const drawing = context();
    renderProductionSkeleton(target, drawing, { landmarks2D: [landmark(11), landmark(13, 0.1)] });
    expect(drawing.stroke).not.toHaveBeenCalled();
    expect(drawing.arc).toHaveBeenCalledOnce();
  });

  it("skips an explicit unavailable slot without shifting later landmark IDs", () => {
    const target = canvas();
    const drawing = context();
    const slots = Array.from({ length: 33 }, () => null as ReturnType<typeof landmark> | null);
    slots[11] = landmark(11);
    slots[13] = null;
    slots[14] = landmark(14);
    renderProductionSkeleton(target, drawing, { landmarks2D: slots });
    expect(drawing.stroke).not.toHaveBeenCalled();
    expect(drawing.arc).toHaveBeenCalledOnce();
    expect(drawing.fillRect).toHaveBeenCalledOnce();
  });

  it("clears missing and stale pose without drawing", () => {
    const target = canvas();
    const drawing = context();
    renderProductionSkeleton(target, drawing, null);
    renderProductionSkeleton(target, drawing, { landmarks2D: [landmark(11)] }, { poseAgeMs: 301 });
    expect(drawing.clearRect).toHaveBeenCalledTimes(2);
    expect(drawing.arc).not.toHaveBeenCalled();
  });
});

describe("production skeleton viewport scaling", () => {
  it("keeps mobile and desktop radius/width within configured CSS bounds", () => {
    const mobile = getProductionSkeletonDisplayScale(320, 1);
    const desktop = getProductionSkeletonDisplayScale(1440, 1);
    expect(mobile.jointRadius).toBeGreaterThanOrEqual(PRODUCTION_SKELETON_PROFILE.landmarkRadius.minimumCssPx);
    expect(desktop.jointRadius).toBeLessThanOrEqual(PRODUCTION_SKELETON_PROFILE.landmarkRadius.maximumCssPx);
    expect(mobile.connectionWidth).toBeGreaterThanOrEqual(PRODUCTION_SKELETON_PROFILE.connectionWidth.minimumCssPx);
    expect(desktop.connectionWidth).toBeLessThanOrEqual(PRODUCTION_SKELETON_PROFILE.connectionWidth.maximumCssPx);
  });

  it("applies device pixel ratio exactly once", () => {
    const css = getProductionSkeletonDisplayScale(720, 1);
    const retina = getProductionSkeletonDisplayScale(720, 2);
    expect(retina.jointRadius).toBe(css.jointRadius * 2);
    expect(retina.connectionWidth).toBe(css.connectionWidth * 2);
    expect(retina.viewportScale).toBe(css.viewportScale);
  });

  it("synchronizes backing size to the displayed viewport before projection", () => {
    const target = canvas(1280, 720, 320);
    const result = syncProductionCanvasSize(target);
    expect(result).toMatchObject({ width: 320, height: 160, devicePixelRatio: 1, changed: true });
    expect(projectProductionSkeletonPoint(target, landmark(11, 1, 0.5, 0.5))).toEqual({ x: 160, y: 80 });
  });

  it("projects mirrored and cover-cropped coordinates correctly", () => {
    const target = canvas(200, 100);
    expect(projectProductionSkeletonPoint(target, landmark(11, 1, 0.25, 0.5))).toEqual({ x: 50, y: 50 });
    expect(projectProductionSkeletonPoint(target, landmark(11, 1, 0.25, 0.5), { mirror: true })).toEqual({ x: 150, y: 50 });
    expect(projectProductionSkeletonPoint(target, landmark(11, 1, 0, 0), { sourceViewport: { sourceWidth: 100, sourceHeight: 100 } })).toEqual({ x: 0, y: -50 });
  });

  it("projects contained media into its actual letterboxed content box", () => {
    const target = canvas(1600, 900);
    expect(projectProductionSkeletonPoint(
      target,
      landmark(11, 1, 0, 0),
      { objectFit: "contain", sourceViewport: { sourceWidth: 800, sourceHeight: 800 } },
    )).toEqual({ x: 350, y: 0 });
    expect(projectProductionSkeletonPoint(
      target,
      landmark(11, 1, 1, 1),
      { objectFit: "contain", sourceViewport: { sourceWidth: 800, sourceHeight: 800 } },
    )).toEqual({ x: 1250, y: 900 });
  });
});
