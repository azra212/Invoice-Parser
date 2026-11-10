import type { ExtractedData } from "@invoice-parser/shared";
import { issue, type ValidationRule } from "../types";

const REQUIRED: Array<{
  field: keyof ExtractedData;
  code: string;
  message: string;
}> = [
  {
    field: "documentType",
    code: "required.documentType",
    message: "Document type missing.",
  },
  {
    field: "supplierName",
    code: "required.supplierName",
    message: "Supplier name missing.",
  },
  {
    field: "documentNumber",
    code: "required.documentNumber",
    message: "Document number missing.",
  },
  {
    field: "issueDate",
    code: "required.issueDate",
    message: "Issue date is missing.",
  },
  {
    field: "dueDate",
    code: "required.dueDate",
    message: "Due date is missing.",
  },
  {
    field: "currency",
    code: "required.currency",
    message: "Currency missing.",
  },
  { field: "total", code: "required.total", message: "Total missing." },
];

export const requiredFieldsRule: ValidationRule = {
  id: "requiredFields",
  async validate(document) {
    return REQUIRED.filter((field) => {
      const value = document[field.field];
      return value === null || value === undefined || value === "";
    }).map((field) => issue(field.field, field.message, "error", field.code));
  },
};
