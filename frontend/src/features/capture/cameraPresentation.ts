export type CameraFacingMode = "user" | "environment";

export function cameraPresentationMirror(facingMode: CameraFacingMode) {
  return facingMode === "user";
}

export function oppositeCameraFacingMode(facingMode: CameraFacingMode): CameraFacingMode {
  return facingMode === "user" ? "environment" : "user";
}
