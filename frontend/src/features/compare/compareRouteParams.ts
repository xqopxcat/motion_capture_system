import type {
  CompareApiParams,
  CompareRouteSelection,
  CompareSelectionSide,
} from "../../types";

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

export function updateCompareRouteSelectionParam(
  searchParams: URLSearchParams,
  side: CompareSelectionSide,
  recordId: string | null,
) {
  const nextSearchParams = new URLSearchParams(searchParams);
  const queryParam = side === "left" ? "left" : "right";
  const normalizedRecordId = normalizeRecordId(recordId);

  if (normalizedRecordId) {
    nextSearchParams.set(queryParam, normalizedRecordId);
    return nextSearchParams;
  }

  nextSearchParams.delete(queryParam);
  return nextSearchParams;
}
