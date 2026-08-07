import { buildPoseDatasetV1 } from "./poseDatasetV1";
import { calculateFormalJointAngle } from "../../engines/motionModel";
import type { CapturePoseDatasetDraft } from "./buildPoseDatasetDraft";
import type {
  ArtifactCompleteResponse,
  CreateRecordResponse,
  FinalizeRecordResponse,
  MetricSummary,
  SignedUploadUrlResponse,
} from "../../types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type CapturePublishStage =
  | "creating"
  | "preparing"
  | "uploading-video"
  | "uploading-pose"
  | "uploading-metrics"
  | "uploading-thumbnail"
  | "finalizing"
  | "ready";

export type CapturePublishProgress = {
  stage: CapturePublishStage;
  message: string;
};

export type CapturePreparationFailureCode = "pose-dataset" | "formal-metrics-unavailable" | "thumbnail-decode";

export class CapturePreparationError extends Error {
  constructor(readonly code: CapturePreparationFailureCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CapturePreparationError";
  }
}

export function capturePreparationFailureCode(error: unknown) {
  return error instanceof CapturePreparationError ? error.code : null;
}

export type CapturePublishResumeState = {
  recordId?: string;
  completedArtifacts: Set<"video" | "pose" | "metrics" | "thumbnail">;
  lifecycleFailed?: boolean;
  creationOutcomeAmbiguous?: boolean;
};

type PublishInput = {
  title: string;
  description?: string;
  videoBlob: Blob;
  poseDraft: CapturePoseDatasetDraft;
  resume: CapturePublishResumeState;
  onProgress: (progress: CapturePublishProgress) => void;
};

type PreparedArtifact = {
  blob: Blob;
  checksum: string;
  contentType: string;
};

const CAPTURE_ARTIFACTS = ["video", "pose", "metrics", "thumbnail"] as const;

export function buildCapturePublishRecoveryPlan(resume: CapturePublishResumeState) {
  return {
    recordId: resume.recordId ?? null,
    createRecord: !resume.recordId && !resume.creationOutcomeAmbiguous,
    missingArtifacts: CAPTURE_ARTIFACTS.filter((artifact) => !resume.completedArtifacts.has(artifact)),
    retryLifecycle: resume.lifecycleFailed === true,
    duplicateCreationBlocked: !resume.recordId && resume.creationOutcomeAmbiguous === true,
  };
}

export async function publishCaptureRecord(input: PublishInput): Promise<FinalizeRecordResponse> {
  const recoveryPlan = buildCapturePublishRecoveryPlan(input.resume);
  if (recoveryPlan.duplicateCreationBlocked) {
    throw new Error("Record creation outcome is ambiguous; duplicate creation is blocked.");
  }
  let poseDataset: ReturnType<typeof buildPoseDatasetV1>;
  try {
    poseDataset = buildPoseDatasetV1(input.poseDraft);
  } catch (error) {
    throw new CapturePreparationError("pose-dataset", "Pose dataset preparation failed.", { cause: error });
  }
  input.onProgress({ stage: "preparing", message: "Preparing browser analysis artifacts…" });

  const pose = await prepareJsonArtifact(poseDataset);
  let metricsPayload: ReturnType<typeof buildKneeMetricSeries>;
  try {
    metricsPayload = buildKneeMetricSeries(poseDataset);
  } catch (error) {
    throw new CapturePreparationError("formal-metrics-unavailable", "Formal metric preparation produced no usable samples.", { cause: error });
  }
  const metrics = await prepareJsonArtifact(metricsPayload.series);
  const videoContentType = normalizeVideoContentType(input.videoBlob.type);
  const videoBlob = new Blob([input.videoBlob], { type: videoContentType });
  const video: PreparedArtifact = {
    blob: videoBlob,
    checksum: await sha256Hex(videoBlob),
    contentType: videoContentType,
  };
  let thumbnailBlob: Blob;
  try {
    thumbnailBlob = await createThumbnail(input.videoBlob);
  } catch (error) {
    throw new CapturePreparationError("thumbnail-decode", "Recorded video thumbnail preparation failed.", { cause: error });
  }
  const thumbnail: PreparedArtifact = {
    blob: thumbnailBlob,
    checksum: await sha256Hex(thumbnailBlob),
    contentType: "image/jpeg",
  };
  const recordId = recoveryPlan.recordId ?? await createRecord(input, poseDataset);
  input.resume.recordId = recordId;

  if (recoveryPlan.missingArtifacts.includes("video")) {
    input.onProgress({ stage: "uploading-video", message: "Uploading video to private storage…" });
    const signed = await apiJson<SignedUploadUrlResponse>("/uploads/video", {
      recordId,
      fileName: videoContentType === "video/mp4" ? "video.mp4" : "video.webm",
      contentType: video.contentType,
      fileSize: video.blob.size,
      checksumAlgorithm: "sha256",
      checksum: video.checksum,
    });
    await uploadSigned(signed.uploadUrl, video);
    await completeArtifact("/uploads/video/complete", recordId, signed.storagePath, video);
    input.resume.completedArtifacts.add("video");
  }

  if (recoveryPlan.missingArtifacts.includes("pose")) {
    input.onProgress({ stage: "uploading-pose", message: "Uploading pose.v1 dataset…" });
    const signed = await requestJsonUpload("/uploads/pose", recordId, pose);
    await uploadSigned(signed.uploadUrl, pose);
    await completeArtifact("/uploads/pose/complete", recordId, signed.storagePath, pose, {
      version: poseDataset.version,
    });
    input.resume.completedArtifacts.add("pose");
  }

  if (recoveryPlan.missingArtifacts.includes("metrics")) {
    input.onProgress({ stage: "uploading-metrics", message: "Uploading Metric Series…" });
    const signed = await requestJsonUpload("/uploads/metrics", recordId, metrics);
    await uploadSigned(signed.uploadUrl, metrics);
    await completeArtifact("/uploads/metrics/complete", recordId, signed.storagePath, metrics, {
      version: "1.0",
      summary: metricsPayload.summary,
    });
    input.resume.completedArtifacts.add("metrics");
  }

  if (recoveryPlan.missingArtifacts.includes("thumbnail")) {
    input.onProgress({ stage: "uploading-thumbnail", message: "Uploading thumbnail…" });
    const signed = await apiJson<SignedUploadUrlResponse>("/uploads/thumbnail", {
      recordId,
      contentType: thumbnail.contentType,
      fileSize: thumbnail.blob.size,
      generatedFromFrameIndex: 0,
      checksumAlgorithm: "sha256",
      checksum: thumbnail.checksum,
    });
    await uploadSigned(signed.uploadUrl, thumbnail);
    await completeArtifact("/uploads/thumbnail/complete", recordId, signed.storagePath, thumbnail, {
      generatedFromFrameIndex: 0,
    });
    input.resume.completedArtifacts.add("thumbnail");
  }

  input.onProgress({ stage: "finalizing", message: "Backend is validating and finalizing…" });
  if (recoveryPlan.retryLifecycle) {
    await apiJson(`/records/${recordId}/retry`, {});
    input.resume.lifecycleFailed = false;
  }
  let finalized: FinalizeRecordResponse;
  try {
    finalized = await apiJson<FinalizeRecordResponse>(`/records/${recordId}/complete`, {});
  } catch (error) {
    const reconciled = await reconcileRecordAfterFinalizeFailure(recordId).catch(() => null);
    if (reconciled?.status === "Ready") {
      input.onProgress({ stage: "ready", message: "Record is ready." });
      return {
        recordId,
        status: "Ready",
        retryable: false,
        failureCode: null,
        failureMessage: null,
      };
    }
    if (reconciled?.status === "Failed" && reconciled.retryable === true) {
      input.resume.lifecycleFailed = true;
    }
    throw error;
  }
  if (finalized.status !== "Ready") {
    input.resume.lifecycleFailed = finalized.status === "Failed" && finalized.retryable === true;
    throw new Error(finalized.failureMessage ?? `Record finalization returned ${finalized.status}.`);
  }
  input.onProgress({ stage: "ready", message: "Record is ready." });
  return finalized;
}

async function reconcileRecordAfterFinalizeFailure(recordId: string) {
  const response = await fetch(`${apiBaseUrl}/records/${recordId}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(`Record reconciliation failed (${response.status}).`);
  return response.json() as Promise<{
    recordId: string;
    status: "Uploading" | "Processing" | "Ready" | "Failed";
    retryable?: boolean;
  }>;
}

async function createRecord(
  input: PublishInput,
  poseDataset: { duration: number; fps: number },
) {
  input.onProgress({ stage: "creating", message: "Creating persistent Record…" });
  if (input.resume.creationOutcomeAmbiguous) {
    throw new Error("Record creation outcome is ambiguous; duplicate creation is blocked.");
  }
  try {
    const response = await apiJson<CreateRecordResponse>("/records", {
      title: input.title.trim() || `Motion Capture ${new Date().toLocaleString()}`,
      description: input.description?.trim() ?? "",
      tags: ["capture"],
      duration: poseDataset.duration,
      fps: poseDataset.fps,
    }, "POST");
    return response.recordId;
  } catch (error) {
    if (error instanceof TypeError) {
      input.resume.creationOutcomeAmbiguous = true;
    }
    throw error;
  }
}

async function requestJsonUpload(path: string, recordId: string, artifact: PreparedArtifact) {
  return apiJson<SignedUploadUrlResponse>(path, {
    recordId,
    contentType: artifact.contentType,
    fileSize: artifact.blob.size,
    checksumAlgorithm: "sha256",
    checksum: artifact.checksum,
  });
}

async function completeArtifact(
  path: string,
  recordId: string,
  storagePath: string,
  artifact: PreparedArtifact,
  additions: Record<string, unknown> = {},
) {
  return apiJson<ArtifactCompleteResponse>(path, {
    recordId,
    storagePath,
    fileSize: artifact.blob.size,
    checksumAlgorithm: "sha256",
    checksum: artifact.checksum,
    ...additions,
  });
}

async function uploadSigned(url: string, artifact: PreparedArtifact) {
  const response = await fetch(url, {
    method: "PUT",
    body: artifact.blob,
    headers: {
      "Content-Type": artifact.contentType,
      "x-goog-meta-sha256": artifact.checksum,
    },
  });
  if (!response.ok) {
    throw new Error(`Private artifact upload failed (${response.status}).`);
  }
}

async function apiJson<T>(
  path: string,
  body: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail;
    throw new Error(
      typeof detail?.message === "string"
        ? detail.message
        : `Backend request failed (${response.status}).`,
    );
  }
  return response.json() as Promise<T>;
}

async function prepareJsonArtifact(value: unknown): Promise<PreparedArtifact> {
  const blob = new Blob([JSON.stringify(value)], { type: "application/json" });
  return {
    blob,
    checksum: await sha256Hex(blob),
    contentType: "application/json",
  };
}

export async function sha256Hex(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeVideoContentType(value: string) {
  return value.toLowerCase().startsWith("video/mp4") ? "video/mp4" : "video/webm";
}

async function createThumbnail(videoBlob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(videoBlob);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "metadata";
  video.src = url;
  try {
    await waitForVideoLoadedData(video);
    if (Number.isFinite(video.duration) && video.duration > 0.1) {
      await seekVideoForThumbnail(video, Math.min(video.duration * 0.25, 1));
    }
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(width, 640);
    canvas.height = Math.round(canvas.width * (height / width));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Thumbnail canvas is unavailable.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Thumbnail encoding failed.")),
        "image/jpeg",
        0.82,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function waitForVideoLoadedData(video: HTMLVideoElement) {
  if (video.readyState >= 2) return Promise.resolve();
  return waitFor(video, "loadeddata");
}

export function seekVideoForThumbnail(video: HTMLVideoElement, targetTimeSeconds: number) {
  if (!Number.isFinite(targetTimeSeconds) || targetTimeSeconds < 0) return Promise.reject(new Error("Thumbnail seek target is invalid."));
  if (Math.abs(video.currentTime - targetTimeSeconds) <= 1e-6) return Promise.resolve();
  const pending = waitFor(video, "seeked");
  video.currentTime = targetTimeSeconds;
  return pending;
}

function waitFor(element: HTMLVideoElement, event: "loadeddata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => reject(new Error(`Video ${event} timed out.`)), 10000);
    element.addEventListener(event, () => {
      globalThis.clearTimeout(timeout);
      resolve();
    }, { once: true });
    element.addEventListener("error", () => {
      globalThis.clearTimeout(timeout);
      reject(new Error("Recorded video could not be decoded."));
    }, { once: true });
  });
}

export function buildKneeMetricSeries(pose: ReturnType<typeof buildPoseDatasetV1>) {
  const values = pose.frames
    .map((frame) => calculateFormalJointAngle({
      timestampMs: frame.timestamp * 1000,
      frameIndex: frame.frameIndex,
      landmarks2D: frame.landmarks2D,
      landmarks3D: frame.landmarks3D,
    }, "joint-angle.left-knee.internal.v1"))
    .map((result) => result.valueDegrees)
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    throw new Error("No valid left-knee metric values were produced.");
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const summary: MetricSummary[] = [{
    metricId: "joint-angle.left-knee.internal.v1",
    unit: "degree",
    metricDefinitionVersion: "joint-angle-contract.v1",
    activityType: "motion_capture",
    side: "left",
    min,
    max,
    average: values.reduce((total, value) => total + value, 0) / values.length,
    rangeOfMotion: max - min,
  }];
  return {
    series: {
      version: "1.0",
      series: [{ metricId: "joint-angle.left-knee.internal.v1", unit: "degree", values }],
    },
    summary,
  };
}
