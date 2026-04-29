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

const documentSchema = new mongoose.Schema(
  {
    fileName: String,

    documentType: {
      type: String,
      enum: ["invoice", "purchase_order"],
    },

    supplierName: String,
    documentNumber: String,
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
