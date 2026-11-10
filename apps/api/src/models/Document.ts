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
});

const originalFileSchema = new mongoose.Schema(
  {
    originalName: String,
    storedName: String,
    path: String,
    mimeType: String,
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

    status: {
      type: String,
      enum: ["uploaded", "needs_review", "validated", "rejected"],
      default: "uploaded",
    },
  },
  { timestamps: true },
);

export const Document = mongoose.model("Document", documentSchema);
