import type { CaptureProductState } from "./captureControllerTypes";

export type CaptureStageMode =
  | "permission"
  | "preparing"
  | "live"
  | "review"
  | "saving"
  | "completed"
  | "failed";

export function getCaptureStageMode(state: CaptureProductState): CaptureStageMode {
  switch (state.type) {
    case "PermissionRequired":
    case "RequestingPermission":
      return "permission";
    case "Preparing":
      return "preparing";
    case "Ready":
    case "Countdown":
    case "Recording":
      return "live";
    case "Reviewing":
      return "review";
    case "Saving":
      return "saving";
    case "Completed":
      return "completed";
    case "Failed":
      return "failed";
  }
}
