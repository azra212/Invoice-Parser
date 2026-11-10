import mongoose from "mongoose";

const auditEventSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: {
      type: String,
      enum: ["created", "edited", "confirmed", "rejected", "deleted", "reprocessed"],
      required: true,
    },
    changes: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditEvent = mongoose.model("AuditEvent", auditEventSchema);
