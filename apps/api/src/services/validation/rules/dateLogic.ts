import type { ValidationIssue } from "@invoice-parser/shared";
import { isAfter, isValid, parseISO } from "date-fns";
import { issue, type ValidationRule } from "../types";

function parseDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export const dateLogicRule: ValidationRule = {
  id: "dateLogic",
  async validate(document) {
    const issues: ValidationIssue[] = [];
    const issueDate = document.issueDate ? parseDate(document.issueDate) : null;
    const dueDate = document.dueDate ? parseDate(document.dueDate) : null;

    if (document.issueDate && !issueDate) {
      issues.push(
        issue(
          "issueDate",
          "Invalid issue date format.",
          "error",
          "date.issueDate",
        ),
      );
    }

    if (document.dueDate && !dueDate) {
      issues.push(
        issue("dueDate", "Invalid due date format.", "error", "date.dueDate"),
      );
    }

    if (issueDate && dueDate && isAfter(issueDate, dueDate)) {
      issues.push(
        issue(
          "dueDate",
          "Due date cannot be before issue date.",
          "error",
          "date.order",
        ),
      );
    }

    return issues;
  },
};
