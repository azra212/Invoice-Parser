import type { ProcessedDocument } from "@invoice-parser/shared";

export function getIssueCount(doc: ProcessedDocument) {
  return doc.validationIssues?.length ?? 0;
}

export function getErrorCount(doc: ProcessedDocument) {
  return (
    doc.validationIssues?.filter((issue) => issue.severity === "error")
      .length ?? 0
  );
}

export function getWarningCount(doc: ProcessedDocument) {
  return (
    doc.validationIssues?.filter((issue) => issue.severity === "warning")
      .length ?? 0
  );
}

export function getStatusColor(status: ProcessedDocument["status"]) {
  const colors: Record<ProcessedDocument["status"], string> = {
    uploaded: "gray",
    processing: "blue",
    needs_review: "orange",
    validated: "green",
    rejected: "red",
    failed: "red",
  };

  return colors[status];
}
