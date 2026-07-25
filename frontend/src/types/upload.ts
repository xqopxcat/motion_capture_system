export type SignedUploadUrlResponse = {
  uploadUrl: string;
  storagePath: string;
  expiresAt: string;
};

export type UploadIntegrity = {
  // Required by the production API path; optional until Task 64 updates callers.
  checksumAlgorithm?: "sha256";
  checksum?: string;
};

export type VideoUploadUrlRequest = UploadIntegrity & {
  recordId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
};

export type PoseUploadUrlRequest = UploadIntegrity & {
  recordId: string;
  contentType: string;
  fileSize: number;
};

export type MetricsUploadUrlRequest = UploadIntegrity & {
  recordId: string;
  contentType: string;
  fileSize: number;
};

export type ThumbnailUploadUrlRequest = UploadIntegrity & {
  recordId: string;
  contentType: string;
  fileSize: number;
  generatedFromFrameIndex: number;
};

export type ArtifactCompleteStatus = "Complete";

export type ArtifactType = "video" | "pose" | "metrics" | "thumbnail";

export type ArtifactCompleteResponse = {
  recordId: string;
  artifactType: ArtifactType;
  storagePath: string;
  status: ArtifactCompleteStatus;
};

export type MetricSummary = {
  metricId: string;
  unit?: string | null;
  metricDefinitionVersion?: string | null;
  activityType?: string | null;
  side?: string | null;
  min: number;
  max: number;
  average: number;
  rangeOfMotion: number;
};

export type MetricsUploadCompleteResponse = ArtifactCompleteResponse & {
  artifactType: "metrics";
  summaryPersisted: boolean;
};

export type UploadCompleteIntegrity = UploadIntegrity & {
  fileSize?: number;
  objectGeneration?: string;
};

export type VideoUploadCompleteRequest = UploadCompleteIntegrity & {
  recordId: string;
  storagePath: string;
};

export type PoseUploadCompleteRequest = UploadCompleteIntegrity & {
  recordId: string;
  storagePath: string;
  version: string;
};

export type MetricsUploadCompleteRequest = UploadCompleteIntegrity & {
  recordId: string;
  storagePath: string;
  version: string;
  summary: MetricSummary[];
};

export type ThumbnailUploadCompleteRequest = UploadCompleteIntegrity & {
  recordId: string;
  storagePath: string;
  generatedFromFrameIndex: number;
};
