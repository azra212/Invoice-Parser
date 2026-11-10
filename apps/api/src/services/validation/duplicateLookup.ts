import { Document } from "../../models/Document";
import type { ValidationContext } from "./types";

export function mongoDuplicateLookup(
  organizationId?: string,
): NonNullable<ValidationContext["findDuplicate"]> {
  return async ({ supplierName, documentNumber, currentDocumentId }) => {
    const query: Record<string, unknown> = { supplierName, documentNumber };
    if (organizationId) query.organizationId = organizationId;
    if (currentDocumentId) {
      query._id = { $ne: currentDocumentId };
    }

    const duplicate = await Document.findOne(query).select("_id");
    return duplicate ? { id: String(duplicate._id) } : null;
  };
}
