import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStreamStatus =
  | "idle"
  | "unsupported"
  | "requesting"
  | "ready"
  | "permission-denied"
  | "error";

type CameraStreamState = {
  status: CameraStreamStatus;
  stream: MediaStream | null;
  errorMessage: string | null;
};

const initialCameraStreamState: CameraStreamState = {
  status: "idle",
  stream: null,
  errorMessage: null,
};

function getCameraErrorState(error: unknown): Pick<CameraStreamState, "status" | "errorMessage"> {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return {
        status: "permission-denied",
        errorMessage: "Camera permission was denied. Allow camera access to preview capture.",
      };
    }

    if (error.name === "NotFoundError") {
      return {
        status: "error",
        errorMessage: "No camera device was found on this browser.",
      };
    }
  }

  return {
    status: "error",
    errorMessage: "Camera preview could not be started.",
  };
}

function stopStreamTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useCameraStream() {
  const [cameraState, setCameraState] = useState<CameraStreamState>(initialCameraStreamState);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    stopStreamTracks(streamRef.current);
    streamRef.current = null;

    if (isMountedRef.current) {
      setCameraState(initialCameraStreamState);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState({
        status: "unsupported",
        stream: null,
        errorMessage: "This browser does not support camera preview.",
      });
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    stopStreamTracks(streamRef.current);
    streamRef.current = null;

    setCameraState({
      status: "requesting",
      stream: null,
      errorMessage: null,
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      });

      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        stopStreamTracks(stream);
        return;
      }

      streamRef.current = stream;
      setCameraState({
        status: "ready",
        stream,
        errorMessage: null,
      });
    } catch (error) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      const errorState = getCameraErrorState(error);
      streamRef.current = null;
      setCameraState({
        ...errorState,
        stream: null,
      });
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      stopStreamTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return {
    ...cameraState,
    startCamera,
    stopCamera,
  };
}
