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
