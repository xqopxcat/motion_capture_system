import type {
  CompareRecordRuntimeState,
  CompareRuntimeArtifact,
  CompareRuntimeIssue,
  CompareRuntimeIssueSeverity,
} from "../../types";

export function createCompareRuntimeIssue({
  artifact,
  debugMessage,
  message,
  severity,
}: {
  artifact: CompareRuntimeArtifact;
  debugMessage?: string;
  message: string;
  severity: CompareRuntimeIssueSeverity;
}): CompareRuntimeIssue {
  return {
    artifact,
    debugMessage,
    message,
    severity,
  };
}

export function hasBlockingCompareRuntimeIssue(runtime: CompareRecordRuntimeState) {
  return runtime.issues.some((issue) => issue.severity === "blocking");
}

export function getPrimaryCompareRuntimeMessage(runtime: CompareRecordRuntimeState) {
  return (
    runtime.issues.find((issue) => issue.severity === "blocking")?.message ??
    runtime.issues[0]?.message ??
    runtime.errorMessage
  );
}
