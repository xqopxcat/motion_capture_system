import { describe, expect, it, vi } from "vitest";
import { NavigationType } from "react-router-dom";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CaptureNavigationDialog,
  createCaptureNavigationBlocker,
  getCaptureNavigationDialogCopy,
  resetStaleBlockedNavigation,
  resolveCaptureNavigation,
  shouldShowCaptureNavigationDialog,
} from "./CaptureNavigationGuard";

const location = (pathname: string) => ({
  pathname,
  search: "",
  hash: "",
  state: null,
  key: pathname,
});

describe("CaptureNavigationGuard", () => {
  it.each([NavigationType.Push, NavigationType.Replace, NavigationType.Pop])(
    "blocks protected %s navigation, including browser Back/Forward via POP",
    (historyAction) => {
      const blocker = createCaptureNavigationBlocker(true);
      expect(blocker({
        currentLocation: location("/capture"),
        nextLocation: location("/records"),
        historyAction,
      })).toBe(true);
    },
  );

  it("does not block Completed and other unprotected states", () => {
    const blocker = createCaptureNavigationBlocker(false);
    expect(blocker({
      currentLocation: location("/capture"),
      nextLocation: location("/records/record-1"),
      historyAction: NavigationType.Push,
    })).toBe(false);
  });

  it("uses the required Reviewing confirmation copy", () => {
    expect(getCaptureNavigationDialogCopy("confirm-unsaved")).toEqual({
      title: "Discard this recording?",
      message: "This recording has not been saved. Leaving this page will discard it.",
      leaveLabel: "Leave and discard",
    });
  });

  it("uses the required Saving confirmation copy", () => {
    expect(getCaptureNavigationDialogCopy("blocked-saving")).toEqual({
      title: "Leave while saving?",
      message: "Your recording is still being saved. Leaving now may interrupt the process.",
      leaveLabel: "Leave anyway",
    });
  });

  it("maps Stay to reset and Leave to proceed on the original pending transition", () => {
    const reset = vi.fn();
    const proceed = vi.fn();
    resolveCaptureNavigation({ reset, proceed }, "stay");
    expect(reset).toHaveBeenCalledOnce();
    expect(proceed).not.toHaveBeenCalled();

    resolveCaptureNavigation({ reset, proceed }, "leave");
    expect(reset).toHaveBeenCalledOnce();
    expect(proceed).toHaveBeenCalledOnce();
  });

  it("resets a stale blocked transition and removes its dialog when protection clears", () => {
    const reset = vi.fn();
    const blocker = { state: "blocked", reset };

    expect(shouldShowCaptureNavigationDialog(blocker.state, true)).toBe(true);
    resetStaleBlockedNavigation(blocker, false);

    expect(reset).toHaveBeenCalledOnce();
    expect(shouldShowCaptureNavigationDialog(blocker.state, false)).toBe(false);
  });

  it("keeps the responsive confirmation dialog accessible", () => {
    const markup = renderToStaticMarkup(
      <CaptureNavigationDialog protection="blocked-saving" onStay={() => undefined} onLeave={() => undefined} />,
    );
    expect(markup).toContain('role="alertdialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("Stay");
    expect(markup).toContain("Leave anyway");
  });
});
