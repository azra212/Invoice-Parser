import { ExtractedData, ValidationIssue } from "../../models/documentTypes";
import { parseISO, isValid, isAfter } from "date-fns";

export class DocumentValidator {
  static validate(data: ExtractedData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // 1. Validate Totals
    const calculatedSubtotal = data.lineItems.reduce(
      (acc, item) => acc + (item.amount ?? 0),
      0,
    );

    if (
      data.subtotal !== null &&
      Math.abs(calculatedSubtotal - data.subtotal) > 0.01
    ) {
      issues.push({
        field: "subtotal",
        message: `Subtotal mismatch. Sum of items is ${calculatedSubtotal}, but document says ${data.subtotal}.`,
        severity: "error",
      });
    }

    if (data.subtotal !== null && data.tax !== null && data.total !== null) {
      const calculatedTotal = data.subtotal + data.tax;

      if (Math.abs(calculatedTotal - data.total) > 0.01) {
        issues.push({
          field: "total",
          message: `Total calculation error. Subtotal (${data.subtotal}) + Tax (${data.tax}) = ${calculatedTotal}, which differs from Total (${data.total}).`,
          severity: "error",
        });
      }
    }

    // 2. Validate Dates
    if (data.issueDate) {
      const parsedIssueDate = parseISO(data.issueDate);

      if (!isValid(parsedIssueDate)) {
        issues.push({
          field: "issueDate",
          message: "Invalid issue date format.",
          severity: "error",
        });
      }
    } else {
      issues.push({
        field: "issueDate",
        message: "Issue date is missing.",
        severity: "error",
      });
    }
    if (data.dueDate) {
      const parsedDueDate = parseISO(data.dueDate);

      if (!isValid(parsedDueDate)) {
        issues.push({
          field: "dueDate",
          message: "Invalid due date format.",
          severity: "warning",
        });
      }
    }

    // 3. Validate Line Items
    data.lineItems.forEach((item, index) => {
      const calcAmount = item.quantity * item.unitPrice;
      if (Math.abs(calcAmount - item.amount) > 0.01) {
        issues.push({
          field: `lineItems[${index}].amount`,
          message: `Amount mismatch for item "${item.description}". Expected ${calcAmount}.`,
          severity: "warning",
        });
      }
    });

    // 4. Missing Fields
    if (!data.documentNumber)
      issues.push({
        field: "documentNumber",
        message: "Document number missing.",
        severity: "error",
      });
    if (!data.supplierName)
      issues.push({
        field: "supplierName",
        message: "Supplier name missing.",
        severity: "error",
      });

    return issues;
  }
}
