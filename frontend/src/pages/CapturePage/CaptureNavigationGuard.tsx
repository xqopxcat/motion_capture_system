import { useEffect, useMemo } from "react";
import { useBlocker } from "react-router-dom";
import type { BlockerFunction } from "react-router-dom";
import type { CapturePresentationModel } from "../../features/capture";
import styles from "./CaptureNavigationGuard.module.css";

export type CaptureNavigationProtection = CapturePresentationModel["routeLeaveProtection"];

export function createCaptureNavigationBlocker(
  routeLeaveRequiresConfirmation: boolean,
): BlockerFunction {
  return () => routeLeaveRequiresConfirmation;
}

export function getCaptureNavigationDialogCopy(protection: CaptureNavigationProtection) {
  return protection === "blocked-saving"
    ? {
        title: "Leave while saving?",
        message: "Your recording is still being saved. Leaving now may interrupt the process.",
        leaveLabel: "Leave anyway",
      }
    : {
        title: "Discard this recording?",
        message: "This recording has not been saved. Leaving this page will discard it.",
        leaveLabel: "Leave and discard",
      };
}

export function resolveCaptureNavigation(
  blocker: { reset: () => void; proceed: () => void },
  decision: "stay" | "leave",
) {
  if (decision === "stay") blocker.reset();
  else blocker.proceed();
}

export function resetStaleBlockedNavigation(
  blocker: { state: string; reset?: () => void },
  routeLeaveRequiresConfirmation: boolean,
) {
  if (blocker.state === "blocked" && !routeLeaveRequiresConfirmation) {
    blocker.reset?.();
  }
}

export function shouldShowCaptureNavigationDialog(
  blockerState: string,
  routeLeaveRequiresConfirmation: boolean,
) {
  return blockerState === "blocked" && routeLeaveRequiresConfirmation;
}

type CaptureNavigationGuardProps = {
  routeLeaveRequiresConfirmation: boolean;
  protection: CaptureNavigationProtection;
};

type CaptureNavigationDialogProps = {
  protection: CaptureNavigationProtection;
  onStay: () => void;
  onLeave: () => void;
};

export function CaptureNavigationDialog({
  protection,
  onStay,
  onLeave,
}: CaptureNavigationDialogProps) {
  const copy = getCaptureNavigationDialogCopy(protection);
  return (
    <div className={styles.backdrop} role="presentation">
      <section
        aria-describedby="capture-navigation-message"
        aria-labelledby="capture-navigation-title"
        aria-modal="true"
        className={styles.dialog}
        role="alertdialog"
      >
        <h2 id="capture-navigation-title">{copy.title}</h2>
        <p id="capture-navigation-message">{copy.message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.stayAction} onClick={onStay} autoFocus>
            Stay
          </button>
          <button type="button" className={styles.leaveAction} onClick={onLeave}>
            {copy.leaveLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function CaptureNavigationGuard({
  routeLeaveRequiresConfirmation,
  protection,
}: CaptureNavigationGuardProps) {
  const shouldBlock = useMemo(
    () => createCaptureNavigationBlocker(routeLeaveRequiresConfirmation),
    [routeLeaveRequiresConfirmation],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    resetStaleBlockedNavigation(blocker, routeLeaveRequiresConfirmation);
  }, [blocker, routeLeaveRequiresConfirmation]);

  if (!shouldShowCaptureNavigationDialog(blocker.state, routeLeaveRequiresConfirmation)) {
    return null;
  }
  if (blocker.state !== "blocked") return null;

  return (
    <CaptureNavigationDialog
      protection={protection}
      onStay={() => resolveCaptureNavigation(blocker, "stay")}
      onLeave={() => resolveCaptureNavigation(blocker, "leave")}
    />
  );
}
