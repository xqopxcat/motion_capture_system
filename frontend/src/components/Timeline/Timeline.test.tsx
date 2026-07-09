import { describe, expect, it, vi } from "vitest";
import type { AnnotationMarker, FrameState } from "../../types";
import { calculateAnnotationMarkerPosition, Timeline } from "./Timeline";

const frame: FrameState = {
  currentFrame: 10,
  fps: 30,
  totalFrames: 101,
};

const marker: AnnotationMarker = {
  annotationId: "annotation_1",
  frameIndex: 25,
  timestamp: 0.83,
  title: "Knee check",
};

describe("Timeline", () => {
  it("calculates marker position from frameIndex and maxFrame", () => {
    expect(calculateAnnotationMarkerPosition(25, 100)).toBe(25);
  });

  it("clamps marker position to the track range", () => {
    expect(calculateAnnotationMarkerPosition(-10, 100)).toBe(0);
    expect(calculateAnnotationMarkerPosition(150, 100)).toBe(100);
  });

  it("handles invalid marker position inputs safely", () => {
    expect(calculateAnnotationMarkerPosition(Number.NaN, 100)).toBeNull();
    expect(calculateAnnotationMarkerPosition(10, 0)).toBe(0);
  });

  it("renders no marker buttons when annotations are empty", () => {
    const tree = Timeline({ frame });

    expect(findElementsByType(tree, "button")).toHaveLength(0);
  });

  it("renders positioned annotation markers", () => {
    const tree = Timeline({ annotations: [marker], frame });
    const buttons = findElementsByType(tree, "button");

    expect(buttons).toHaveLength(1);
    expect(buttons[0].props["aria-label"]).toBe("Annotation marker: Knee check");
    expect(buttons[0].props.style).toEqual({ left: "25%" });
  });

  it("does not render markers with invalid frameIndex", () => {
    const tree = Timeline({
      annotations: [{ ...marker, annotationId: "annotation_invalid", frameIndex: Number.NaN }],
      frame,
    });

    expect(findElementsByType(tree, "button")).toHaveLength(0);
  });

  it("emits marker click intent with the clicked marker", () => {
    const handleMarkerClick = vi.fn();
    const tree = Timeline({
      annotations: [marker],
      frame,
      onAnnotationMarkerClick: handleMarkerClick,
    });
    const [button] = findElementsByType(tree, "button");

    button.props.onClick();

    expect(handleMarkerClick).toHaveBeenCalledWith(marker);
  });

  it("keeps existing seek behavior", () => {
    const handleSeekFrame = vi.fn();
    const tree = Timeline({ frame, onSeekFrame: handleSeekFrame });
    const [slider] = findElementsByType(tree, "input");

    slider.props.onChange({ target: { value: "42" } });

    expect(handleSeekFrame).toHaveBeenCalledWith(42);
  });
});

function findElementsByType(tree: unknown, type: string): Array<{ props: Record<string, any> }> {
  if (!tree || typeof tree !== "object") {
    return [];
  }

  const element = tree as { props?: { children?: unknown }; type?: unknown };
  const matches = element.type === type ? [{ props: element.props as Record<string, any> }] : [];
  const children = element.props?.children;

  if (Array.isArray(children)) {
    return matches.concat(children.flatMap((child) => findElementsByType(child, type)));
  }

  return matches.concat(findElementsByType(children, type));
}
