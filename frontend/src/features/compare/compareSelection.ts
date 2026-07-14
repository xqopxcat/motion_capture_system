import type { CompareRouteSelection, CompareSelectionSide, RecordListItem } from "../../types";

export function findCompareRecord(records: RecordListItem[], recordId: string | null) {
  if (!recordId) {
    return undefined;
  }

  return records.find((record) => record.recordId === recordId);
}

export function getCompareSelectionValidationMessages(
  selection: CompareRouteSelection,
  records: RecordListItem[],
) {
  const messages: string[] = [];
  const leftRecord = findCompareRecord(records, selection.leftRecordId);
  const rightRecord = findCompareRecord(records, selection.rightRecordId);

  if (
    selection.leftRecordId &&
    selection.rightRecordId &&
    selection.leftRecordId === selection.rightRecordId
  ) {
    messages.push("Left and right cannot use the same Record.");
  }

  if (selection.leftRecordId && !leftRecord) {
    messages.push(`Left Record "${selection.leftRecordId}" was not found.`);
  }

  if (selection.rightRecordId && !rightRecord) {
    messages.push(`Right Record "${selection.rightRecordId}" was not found.`);
  }

  if (leftRecord && leftRecord.status !== "Ready") {
    messages.push(`Left Record "${leftRecord.title}" is ${leftRecord.status}, not Ready.`);
  }

  if (rightRecord && rightRecord.status !== "Ready") {
    messages.push(`Right Record "${rightRecord.title}" is ${rightRecord.status}, not Ready.`);
  }

  return messages;
}

export function canSelectCompareRecord({
  records,
  recordId,
  selection,
  side,
}: {
  records: RecordListItem[];
  recordId: string;
  selection: CompareRouteSelection;
  side: CompareSelectionSide;
}) {
  const record = findCompareRecord(records, recordId);

  if (!record || record.status !== "Ready") {
    return false;
  }

  return !(
    (side === "left" && selection.rightRecordId === recordId) ||
    (side === "right" && selection.leftRecordId === recordId)
  );
}
