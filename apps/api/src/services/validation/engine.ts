import type { ExtractedData, ValidationIssue } from "@invoice-parser/shared";
import { dateLogicRule } from "./rules/dateLogic";
import { duplicateDocumentRule } from "./rules/duplicateDocument";
import { lineItemMathRule } from "./rules/lineItemMath";
import { requiredFieldsRule } from "./rules/requiredFields";
import { totalsRule } from "./rules/totals";
import { vatRateRule } from "./rules/vatRate";
import type { ValidationContext, ValidationRule } from "./types";

export const validationRules: ValidationRule[] = [
  requiredFieldsRule,
  dateLogicRule,
  lineItemMathRule,
  totalsRule,
  duplicateDocumentRule,
  vatRateRule,
];

export async function validateDocument(
  document: ExtractedData,
  context: ValidationContext = {},
  rules: ValidationRule[] = validationRules,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  for (const rule of rules) {
    issues.push(...(await rule.validate(document, context)));
  }
  return issues;
}

export function statusForIssues(
  issues: ValidationIssue[],
): "needs_review" | "validated" {
  return issues.some((item) => item.severity === "error")
    ? "needs_review"
    : "validated";
}
