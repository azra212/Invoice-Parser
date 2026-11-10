import { AuditEvent } from "../../models/AuditEvent";

export type AuditAction =
  | "created"
  | "edited"
  | "confirmed"
  | "rejected"
  | "deleted"
  | "reprocessed";

export async function recordAudit(input: {
  organizationId: string;
  documentId: string;
  userId: string;
  action: AuditAction;
  changes?: Record<string, { from: unknown; to: unknown }>;
}): Promise<void> {
  await AuditEvent.create(input);
}
