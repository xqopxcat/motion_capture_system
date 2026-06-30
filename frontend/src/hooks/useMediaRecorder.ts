import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingStatus =
  | "idle"
  | "unsupported"
  | "recording"
  | "stopping"
  | "recorded"
  | "error";

type MediaRecordingState = {
  status: RecordingStatus;
  elapsedSeconds: number;
  recordedBlob: Blob | null;
  recordedVideoUrl: string | null;
  errorMessage: string | null;
};

const initialMediaRecordingState: MediaRecordingState = {
  status: "idle",
  elapsedSeconds: 0,
  recordedBlob: null,
  recordedVideoUrl: null,
  errorMessage: null,
};

const preferredMimeTypes = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return preferredMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

export function useMediaRecorder(stream: MediaStream | null) {
  const [recordingState, setRecordingState] =
    useState<MediaRecordingState>(initialMediaRecordingState);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startedAtRef.current = null;
  }, []);

  const revokeRecordedVideoUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const resetRecordingResult = useCallback(() => {
    revokeRecordedVideoUrl();
    setRecordingState((currentState) => ({
      ...currentState,
      elapsedSeconds: 0,
      recordedBlob: null,
      recordedVideoUrl: null,
      errorMessage: null,
    }));
  }, [revokeRecordedVideoUrl]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      clearTimer();
      return;
    }

    setRecordingState((currentState) => ({
      ...currentState,
      status: "stopping",
    }));
    recorder.stop();
  }, [clearTimer]);

  const startRecording = useCallback(() => {
    if (typeof MediaRecorder === "undefined") {
      setRecordingState({
        ...initialMediaRecordingState,
        status: "unsupported",
        errorMessage: "This browser does not support local video recording.",
      });
      return;
    }

    if (!stream) {
      setRecordingState((currentState) => ({
        ...currentState,
        status: "error",
        errorMessage: "Start camera preview before recording.",
      }));
      return;
    }

    if (recorderRef.current?.state === "recording") {
      return;
    }

    resetRecordingResult();
    chunksRef.current = [];

    try {
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearTimer();
        setRecordingState((currentState) => ({
          ...currentState,
          status: "error",
          errorMessage: "Recording failed in the browser.",
        }));
      };

      recorder.onstop = () => {
        clearTimer();
        const recordedBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        chunksRef.current = [];
        recorderRef.current = null;

        if (recordedBlob.size === 0) {
          setRecordingState((currentState) => ({
            ...currentState,
            status: "error",
            errorMessage: "Recording finished without video data.",
          }));
          return;
        }

        revokeRecordedVideoUrl();
        const recordedVideoUrl = URL.createObjectURL(recordedBlob);
        objectUrlRef.current = recordedVideoUrl;
        setRecordingState((currentState) => ({
          ...currentState,
          status: "recorded",
          recordedBlob,
          recordedVideoUrl,
          errorMessage: null,
        }));
      };

      recorder.start();
      startedAtRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const startedAt = startedAtRef.current;

        if (startedAt !== null) {
          setRecordingState((currentState) => ({
            ...currentState,
            elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
          }));
        }
      }, 250);

      setRecordingState({
        status: "recording",
        elapsedSeconds: 0,
        recordedBlob: null,
        recordedVideoUrl: null,
        errorMessage: null,
      });
    } catch (error) {
      clearTimer();
      recorderRef.current = null;
      setRecordingState({
        ...initialMediaRecordingState,
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Local video recording could not be started.",
      });
    }
  }, [clearTimer, resetRecordingResult, revokeRecordedVideoUrl, stream]);

  useEffect(() => {
    if (!stream && recorderRef.current?.state === "recording") {
      stopRecording();
    }
  }, [stopRecording, stream]);

  useEffect(() => {
    return () => {
      clearTimer();

      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }

      recorderRef.current = null;
      chunksRef.current = [];
      revokeRecordedVideoUrl();
    };
  }, [clearTimer, revokeRecordedVideoUrl]);

  return {
    ...recordingState,
    startRecording,
    stopRecording,
    resetRecordingResult,
  };
}
