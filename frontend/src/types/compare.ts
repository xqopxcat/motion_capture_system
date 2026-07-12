import type { RecordDetail } from "./record";

export type CompareRouteSelection = {
  leftRecordId: string | null;
  rightRecordId: string | null;
};

export type CompareApiParams = {
  recordA: string;
  recordB: string;
};

export type CompareDataResponse = {
  recordA: RecordDetail;
  recordB: RecordDetail;
};
