export type RecordStatus = "Uploading" | "Processing" | "Ready" | "Failed";

export type CreateRecordRequest = {
  title: string;
  description: string;
  tags: string[];
};

export type CreateRecordResponse = {
  recordId: string;
  status: RecordStatus;
};

export type FinalizeRecordRequest = {
  recordId: string;
};

export type FinalizeRecordResponse = {
  recordId: string;
  status: "Ready";
};

export type RecordDetailVideo = {
  url: string;
  duration: number | null;
  fps: number | null;
};

export type RecordDetailPose = {
  url: string;
  version: string;
};

export type RecordDetailMetricSummary = {
  metricId: string;
  unit: string | null;
  metricDefinitionVersion: string | null;
  activityType: string | null;
  side: string | null;
  min: number;
  max: number;
  average: number;
  rangeOfMotion: number;
};

export type RecordDetailMetrics = {
  seriesUrl: string | null;
  summary: RecordDetailMetricSummary[];
};

export type RecordDetail = {
  recordId: string;
  title: string;
  description: string;
  status: RecordStatus;
  video: RecordDetailVideo | null;
  pose: RecordDetailPose | null;
  metrics: RecordDetailMetrics | null;
  tags: string[];
  createdAt: string;
};

export type RecordListItem = {
  recordId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  duration: number | null;
  status: RecordStatus;
  tags: string[];
  createdAt: string;
};

export type ListRecordsResponse = {
  items: RecordListItem[];
  total: number;
};
