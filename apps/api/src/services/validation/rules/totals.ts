import type { ValidationIssue } from "@invoice-parser/shared";
import { moneyEquals, roundCurrency } from "../money";
import { issue, type ValidationRule } from "../types";

export const totalsRule: ValidationRule = {
  id: "totals",
  async validate(document) {
    const issues: ValidationIssue[] = [];
    const calculatedSubtotal = roundCurrency(
      document.lineItems.reduce((sum, item) => sum + (item.amount ?? 0), 0),
      document.currency,
    );

    if (
      document.subtotal !== null &&
      !moneyEquals(calculatedSubtotal, document.subtotal, document.currency)
    ) {
      issues.push(
        issue(
          "subtotal",
          `Subtotal mismatch. Sum of items is ${calculatedSubtotal}, but document says ${document.subtotal}.`,
          "error",
          "totals.subtotal",
        ),
      );
    }

    if (
      document.subtotal !== null &&
      document.tax !== null &&
      document.total !== null
    ) {
      const calculatedTotal = roundCurrency(
        document.subtotal + document.tax,
        document.currency,
      );
      if (!moneyEquals(calculatedTotal, document.total, document.currency)) {
        issues.push(
          issue(
            "total",
            `Total calculation error. Subtotal (${document.subtotal}) + Tax (${document.tax}) = ${calculatedTotal}, which differs from Total (${document.total}).`,
            "error",
            "totals.total",
          ),
        );
      }
    }

    return issues;
  },
};
