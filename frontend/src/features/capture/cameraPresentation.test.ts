import { describe, expect, it } from "vitest";
import { cameraPresentationMirror, oppositeCameraFacingMode } from "./cameraPresentation";

describe("Task 84 camera presentation", () => {
  it("mirrors front exactly once and keeps rear non-mirrored", () => {
    expect(cameraPresentationMirror("user")).toBe(true);
    expect(cameraPresentationMirror("environment")).toBe(false);
  });

  it("first flip changes presentation and second flip restores the initial state", () => {
    const initial = "user" as const;
    const first = oppositeCameraFacingMode(initial);
    const second = oppositeCameraFacingMode(first);
    expect(first).toBe("environment");
    expect(second).toBe(initial);
    expect([initial, first, second].map(cameraPresentationMirror)).toEqual([true, false, true]);
  });
});
