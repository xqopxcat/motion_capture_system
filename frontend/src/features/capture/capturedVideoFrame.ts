import type { VideoFrameCandidate } from "./videoFrameProducer";

export type CapturedVideoFrame = VideoFrameCandidate & {
  source: HTMLCanvasElement;
  release(): void;
};

export function captureVideoFrame(
  video: HTMLVideoElement,
  candidate: VideoFrameCandidate,
): CapturedVideoFrame | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width <= 0 || height <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.width = 0;
    canvas.height = 0;
    return null;
  }
  context.drawImage(video, 0, 0, width, height);
  let released = false;

  return {
    ...candidate,
    source: canvas,
    release() {
      if (released) return;
      released = true;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
