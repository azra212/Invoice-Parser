import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  unitPrice: Number,
  amount: Number,
});

const validationIssueSchema = new mongoose.Schema({
  field: String,
  message: String,
  severity: {
    type: String,
    enum: ["error", "warning"],
  },
  code: String,
});

const originalFileSchema = new mongoose.Schema(
  {
    originalName: String,
    storedName: String,
    path: String,
    mimeType: String,
    storageKey: String,
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    fileName: String,
    originalFile: originalFileSchema,

    documentType: {
      type: String,
      enum: ["invoice", "purchase_order"],
    },

    supplierName: String,
    documentNumber: {
      type: String,
      index: true,
    },
    issueDate: String,
    dueDate: String,
    currency: String,

    lineItems: [lineItemSchema],

    subtotal: Number,
    tax: Number,
    total: Number,

    validationIssues: [validationIssueSchema],

    fieldConfidence: {
      type: mongoose.Schema.Types.Mixed,
    },

    rawExtraction: {
      type: new mongoose.Schema(
        {
          provider: String,
          model: String,
          output: mongoose.Schema.Types.Mixed,
          receivedAt: String,
        },
        { _id: false },
      ),
    },

    processingAttempt: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "uploaded",
        "processing",
        "needs_review",
        "validated",
        "rejected",
        "failed",
      ],
      default: "uploaded",
    },
  },
  { timestamps: true },
);

export const Document = mongoose.model("Document", documentSchema);
