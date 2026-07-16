export type SignedUploadUrlResponse = {
  uploadUrl: string;
  storagePath: string;
  expiresAt: string;
};

export type VideoUploadUrlRequest = {
  recordId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
};

export type PoseUploadUrlRequest = {
  recordId: string;
  contentType: string;
};

export type MetricsUploadUrlRequest = {
  recordId: string;
  contentType: string;
};

export type ThumbnailUploadUrlRequest = {
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

export type VideoUploadCompleteRequest = {
  recordId: string;
  storagePath: string;
};

export type PoseUploadCompleteRequest = {
  recordId: string;
  storagePath: string;
  version: string;
};

export type MetricsUploadCompleteRequest = {
  recordId: string;
  storagePath: string;
  version: string;
  summary: MetricSummary[];
};

export type ThumbnailUploadCompleteRequest = {
  recordId: string;
  storagePath: string;
  generatedFromFrameIndex: number;
};
