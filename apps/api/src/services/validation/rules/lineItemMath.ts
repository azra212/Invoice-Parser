import type { ValidationIssue } from "@invoice-parser/shared";
import { moneyEquals, roundCurrency } from "../money";
import { issue, type ValidationRule } from "../types";

export const lineItemMathRule: ValidationRule = {
  id: "lineItemMath",
  async validate(document) {
    const issues: ValidationIssue[] = [];

    document.lineItems.forEach((item, index) => {
      if (!item.description) {
        issues.push(
          issue(
            `lineItems[${index}].description`,
            "Line item description missing.",
            "warning",
            "line.description",
          ),
        );
      }

      if (item.quantity === null || item.quantity === undefined) {
        issues.push(
          issue(
            `lineItems[${index}].quantity`,
            "Line item quantity missing.",
            "warning",
            "line.quantity",
          ),
        );
      }

      if (item.unitPrice === null || item.unitPrice === undefined) {
        issues.push(
          issue(
            `lineItems[${index}].unitPrice`,
            "Line item unit price missing.",
            "warning",
            "line.unitPrice",
          ),
        );
      }

      if (item.amount === null || item.amount === undefined) {
        issues.push(
          issue(
            `lineItems[${index}].amount`,
            "Line item amount missing.",
            "warning",
            "line.amount",
          ),
        );
      }

      if (
        item.quantity !== null &&
        item.unitPrice !== null &&
        item.amount !== null
      ) {
        const expected = roundCurrency(
          item.quantity * item.unitPrice,
          document.currency,
        );
        if (!moneyEquals(expected, item.amount, document.currency)) {
          issues.push(
            issue(
              `lineItems[${index}].amount`,
              `Amount mismatch for item "${item.description ?? "unknown"}". Expected ${expected}.`,
              "warning",
              "line.math",
            ),
          );
        }
      }
    });

    return issues;
  },
};
