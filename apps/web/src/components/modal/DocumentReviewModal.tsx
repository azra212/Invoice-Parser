import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
} from "@chakra-ui/react";
import type { LineItem, ProcessedDocument } from "@invoice-parser/shared";

import { formatDateTime, formatStatus } from "../../utils/documentFormatters";

import { DocumentPreview } from "./DocumentPreview";
import { ValidationIssuesBox } from "./ValidationIssuesBox";
import { LineItemsEditor } from "./LineItemsEditor";
import { TotalsEditor } from "./TotalsEditor";
import { ReviewActions } from "./ReviewActions";
import { DocumentFieldsForm } from "./DocumentFieldsForm";
import { getStatusColor, getIssueCount } from "../../utils/documentStatus";

interface DocumentReviewModalProps {
  selectedDoc: ProcessedDocument;
  onClose: () => void;
  updateDoc: (id: string, updates: Partial<ProcessedDocument>) => Promise<void>;
  deleteDoc: (id: string) => void;
  reprocessDoc: (id: string) => Promise<void>;
  actionError: string | null;
}

type EditableDocumentFields = Pick<
  ProcessedDocument,
  | "documentType"
  | "supplierName"
  | "documentNumber"
  | "issueDate"
  | "dueDate"
  | "currency"
  | "lineItems"
  | "subtotal"
  | "tax"
  | "total"
>;

type EditableDocumentMainFields = Pick<
  EditableDocumentFields,
  | "documentType"
  | "supplierName"
  | "documentNumber"
  | "issueDate"
  | "dueDate"
  | "currency"
>;

const createEditForm = (doc: ProcessedDocument): EditableDocumentFields => ({
  documentType: doc.documentType ?? null,
  supplierName: doc.supplierName ?? "",
  documentNumber: doc.documentNumber ?? "",
  issueDate: doc.issueDate ?? "",
  dueDate: doc.dueDate ?? "",
  currency: doc.currency ?? "",
  lineItems: doc.lineItems?.length
    ? doc.lineItems.map((item) => ({
        description: item.description ?? "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      }))
    : [],
  subtotal: doc.subtotal,
  tax: doc.tax,
  total: doc.total,
});

const emptyLineItem: LineItem = {
  description: "",
  quantity: null,
  unitPrice: null,
  amount: null,
};

const toNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const toNullableNumber = (value: string) => {
  if (value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export function DocumentReviewModal({
  selectedDoc,
  onClose,
  updateDoc,
  deleteDoc,
  reprocessDoc,
  actionError,
}: DocumentReviewModalProps) {
  const [editForm, setEditForm] = useState<EditableDocumentFields>(() =>
    createEditForm(selectedDoc),
  );

  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setEditForm(createEditForm(selectedDoc));
  }, [selectedDoc]);

  const documentId = selectedDoc._id ?? selectedDoc.id;

  const requireDocumentId = () => {
    if (!documentId) {
      throw new Error("Document id is missing.");
    }
    return documentId;
  };

  const updateField = <K extends keyof EditableDocumentFields>(
    field: K,
    value: EditableDocumentFields[K],
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const updateMainField = <K extends keyof EditableDocumentMainFields>(
    field: K,
    value: EditableDocumentMainFields[K],
  ) => {
    updateField(field, value as EditableDocumentFields[K]);
  };

  const updateLineItem = <K extends keyof LineItem>(
    index: number,
    field: K,
    value: LineItem[K],
  ) => {
    setEditForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const addLineItem = () => {
    setEditForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { ...emptyLineItem }],
    }));
    setHasUnsavedChanges(true);
  };

  const removeLineItem = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, itemIndex) => itemIndex !== index),
    }));
    setHasUnsavedChanges(true);
  };

  const saveCorrections = async () => {
    setSaving(true);

    try {
      await updateDoc(requireDocumentId(), {
        documentType: editForm.documentType,
        supplierName: toNullableString(editForm.supplierName ?? ""),
        documentNumber: toNullableString(editForm.documentNumber ?? ""),
        issueDate: toNullableString(editForm.issueDate ?? ""),
        dueDate: toNullableString(editForm.dueDate ?? ""),
        currency:
          toNullableString(editForm.currency ?? "")?.toUpperCase() ?? null,
        lineItems: editForm.lineItems.map((item) => ({
          description: toNullableString(item.description ?? ""),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        subtotal: editForm.subtotal,
        tax: editForm.tax,
        total: editForm.total,
      });
    } finally {
      setSaving(false);
      setHasUnsavedChanges(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (typing) return;
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveCorrections();
      }
      if (event.key.toLowerCase() === "c") {
        void updateDoc(requireDocumentId(), { status: "validated" });
      }
      if (event.key.toLowerCase() === "r") {
        void updateDoc(requireDocumentId(), { status: "rejected" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.600"
      zIndex={100}
      overflowY="auto"
      p={{ base: 0, md: 6 }}
    >
      <Box
        bg={{ base: "white", _dark: "gray.800" }}
        borderRadius={{ base: 0, md: "xl" }}
        minH="100%"
        p={{ base: 4, md: 6 }}
      >
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "1fr 1fr" }}
          gap={6}
        >
          <Box>
            <Text fontSize="sm" fontWeight="bold" mb={2}>
              Original
            </Text>
            <DocumentPreview
              documentId={requireDocumentId()}
              mimeType={selectedDoc.originalFile?.mimeType}
            />
          </Box>
          <VStack align="stretch" gap={6}>
            <HStack justify="space-between" align="center">
              <Heading size="md">Review Document</Heading>

              <HStack gap={2}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedDoc.originalFile}
                  onClick={() => {
                    window.open(
                      `/api/v1/documents/${requireDocumentId()}/original`,
                      "_blank",
                    );
                  }}
                >
                  <ExternalLink size={16} />
                  Original
                </Button>

                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
              </HStack>
            </HStack>

            {selectedDoc.validationIssues?.length > 0 && (
              <ValidationIssuesBox issues={selectedDoc.validationIssues} />
            )}

            {actionError && (
              <Box
                borderWidth="1px"
                borderColor="red.200"
                bg="red.50"
                color="red.700"
                px={4}
                py={3}
                borderRadius="md"
              >
                <Text fontSize="sm" fontWeight="medium">
                  {actionError}
                </Text>
              </Box>
            )}
            <VStack align="stretch" gap={4}>
              <DocumentFieldsForm
                values={{
                  documentType: editForm.documentType,
                  supplierName: editForm.supplierName,
                  documentNumber: editForm.documentNumber,
                  issueDate: editForm.issueDate,
                  dueDate: editForm.dueDate,
                  currency: editForm.currency,
                }}
                issues={selectedDoc.validationIssues}
                confidence={selectedDoc.fieldConfidence}
                onFieldChange={updateMainField}
              />

              <Box>
                <Text fontSize="xs" fontWeight="bold" color="gray.500">
                  VALIDATION STATUS
                </Text>
                <VStack align="start" gap={1}>
                  <Badge colorPalette={getStatusColor(selectedDoc.status)}>
                    {formatStatus(selectedDoc.status)}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    {getIssueCount(selectedDoc)} issue
                    {getIssueCount(selectedDoc) === 1 ? "" : "s"}
                  </Text>
                </VStack>
              </Box>
              <LineItemsEditor
                lineItems={editForm.lineItems}
                onChange={updateLineItem}
                onAdd={addLineItem}
                onRemove={removeLineItem}
                toNullableNumber={toNullableNumber}
              />

              <TotalsEditor
                subtotal={editForm.subtotal}
                tax={editForm.tax}
                total={editForm.total}
                onSubtotalChange={(value) => updateField("subtotal", value)}
                onTaxChange={(value) => updateField("tax", value)}
                onTotalChange={(value) => updateField("total", value)}
                toNullableNumber={toNullableNumber}
              />

              <Box bg="gray.50" p={4} borderRadius="md">
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Created At
                    </Text>
                    <Text fontSize="sm">
                      {formatDateTime(selectedDoc.createdAt)}
                    </Text>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Updated At
                    </Text>
                    <Text fontSize="sm">
                      {formatDateTime(selectedDoc.updatedAt)}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>

            <Text fontSize="xs" color="gray.500">
              Shortcuts when not typing: S save, C confirm, R reject, Esc close.
            </Text>
            <ReviewActions
              saving={saving}
              onSave={saveCorrections}
              onValidate={() =>
                updateDoc(requireDocumentId(), { status: "validated" })
              }
              onReject={() =>
                updateDoc(requireDocumentId(), { status: "rejected" })
              }
              onDelete={() => deleteDoc(requireDocumentId())}
              onReprocess={() => reprocessDoc(requireDocumentId())}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
