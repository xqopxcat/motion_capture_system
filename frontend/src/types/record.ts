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
