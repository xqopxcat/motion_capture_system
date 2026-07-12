import type { CompareApiParams, CompareRouteSelection } from "../../types";

function normalizeRecordId(value: string | null) {
  const normalizedValue = value?.trim() ?? "";

  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function parseCompareRouteSelection(
  searchParams: URLSearchParams,
): CompareRouteSelection {
  return {
    leftRecordId: normalizeRecordId(searchParams.get("left")),
    rightRecordId: normalizeRecordId(searchParams.get("right")),
  };
}

export function mapCompareSelectionToApiParams({
  leftRecordId,
  rightRecordId,
}: CompareRouteSelection): CompareApiParams | null {
  if (!leftRecordId || !rightRecordId) {
    return null;
  }

  return {
    recordA: leftRecordId,
    recordB: rightRecordId,
  };
}
