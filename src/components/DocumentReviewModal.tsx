import { useEffect, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Trash2,
  Save,
  Plus,
  Minus,
} from "lucide-react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Badge,
  Table,
  Input,
  NativeSelect,
} from "@chakra-ui/react";
import {
  LineItem,
  ProcessedDocument,
} from "../../backend/models/documentTypes";

interface DocumentReviewModalProps {
  selectedDoc: ProcessedDocument;
  onClose: () => void;
  updateDoc: (id: string, updates: Partial<ProcessedDocument>) => Promise<void>;
  deleteDoc: (id: string) => void;
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
  actionError,
}: DocumentReviewModalProps) {
  const [editForm, setEditForm] = useState<EditableDocumentFields>(() =>
    createEditForm(selectedDoc),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditForm(createEditForm(selectedDoc));
  }, [selectedDoc]);

  const updateField = <K extends keyof EditableDocumentFields>(
    field: K,
    value: EditableDocumentFields[K],
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
  };

  const addLineItem = () => {
    setEditForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { ...emptyLineItem }],
    }));
  };

  const removeLineItem = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveCorrections = async () => {
    setSaving(true);

    try {
      await updateDoc(selectedDoc._id, {
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
    }
  };
  const displayValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
  };

  const displayMoney = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return value.toLocaleString();
  };

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString();
  };

  const formatStatus = (status: string | null | undefined) => {
    if (!status) return "—";
    return status.replace("_", " ");
  };

  const issueCount = (doc: any) => {
    return doc.validationIssues?.length ?? 0;
  };

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      h="100vh"
      w={{ base: "100%", md: "720px" }}
      bg="white"
      shadow="2xl"
      zIndex={100}
      borderLeft="1px solid"
      borderColor="gray.100"
      p={8}
      overflowY="auto"
    >
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align="center">
          <Heading size="md">Review Document</Heading>

          <HStack gap={2}>
            <Button variant="ghost" size="sm" onClick={() => {}}>
              <ExternalLink size={16} />
              Original
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </HStack>

        {selectedDoc.validationIssues?.length > 0 && (
          <Box
            p={4}
            bg="orange.50"
            borderRadius="md"
            border="1px solid"
            borderColor="orange.100"
          >
            <VStack align="start" gap={2}>
              <HStack color="orange.700">
                <AlertCircle size={16} />{" "}
                <Text fontWeight="bold" fontSize="sm">
                  Validation Issues
                </Text>
              </HStack>
              {selectedDoc.validationIssues?.map((issue: any, i: number) => (
                <Text key={i} fontSize="xs" color="orange.800">
                  • {issue.message}
                </Text>
              ))}
            </VStack>
          </Box>
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
          <SimpleGrid columns={2} gap={4}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                TYPE
              </Text>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={editForm.documentType ?? ""}
                  onChange={(e) =>
                    updateField(
                      "documentType",
                      e.target.value === ""
                        ? null
                        : (e.target.value as "invoice" | "purchase_order"),
                    )
                  }
                >
                  <option value="">Missing</option>
                  <option value="invoice">Invoice</option>
                  <option value="purchase_order">Purchase Order</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                NUMBER
              </Text>
              <Input
                size="sm"
                value={editForm.documentNumber ?? ""}
                onChange={(e) => updateField("documentNumber", e.target.value)}
                placeholder="Document number"
              />
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                SUPPLIER
              </Text>
              <Input
                size="sm"
                value={editForm.supplierName ?? ""}
                onChange={(e) => updateField("supplierName", e.target.value)}
                placeholder="Supplier name"
              />
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                ISSUE DATE
              </Text>
              <Input
                size="sm"
                value={editForm.issueDate ?? ""}
                onChange={(e) => updateField("issueDate", e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                DUE DATE
              </Text>
              <Input
                size="sm"
                value={editForm.dueDate ?? ""}
                onChange={(e) => updateField("dueDate", e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                CURRENCY
              </Text>
              <Input
                size="sm"
                value={editForm.currency ?? ""}
                onChange={(e) => updateField("currency", e.target.value)}
                placeholder="USD"
              />
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                VALIDATION STATUS
              </Text>
              <VStack align="start" gap={1}>
                <Badge
                  colorPalette={
                    selectedDoc.status === "validated"
                      ? "green"
                      : selectedDoc.status === "needs_review"
                        ? "orange"
                        : selectedDoc.status === "rejected"
                          ? "red"
                          : "gray"
                  }
                >
                  {formatStatus(selectedDoc.status)}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  {issueCount(selectedDoc)} issue
                  {issueCount(selectedDoc) === 1 ? "" : "s"}
                </Text>
              </VStack>
            </Box>
          </SimpleGrid>

          <Box mt={4}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>
              LINE ITEMS
            </Text>

            <Table.Root size="sm" variant="outline">
              <Table.Header bg="gray.50">
                <Table.Row>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Quantity
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Unit Price
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Amount
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Actions
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {editForm.lineItems.length > 0 ? (
                  editForm.lineItems.map((item, i) => (
                    <Table.Row key={i}>
                      <Table.Cell>
                        <Input
                          size="xs"
                          value={item.description ?? ""}
                          onChange={(e) =>
                            updateLineItem(i, "description", e.target.value)
                          }
                          placeholder="Description"
                        />
                      </Table.Cell>

                      <Table.Cell textAlign="right">
                        <Input
                          size="xs"
                          type="number"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            updateLineItem(
                              i,
                              "quantity",
                              toNullableNumber(e.target.value),
                            )
                          }
                          placeholder="Qty"
                        />
                      </Table.Cell>

                      <Table.Cell textAlign="right">
                        <Input
                          size="xs"
                          type="number"
                          value={item.unitPrice ?? ""}
                          onChange={(e) =>
                            updateLineItem(
                              i,
                              "unitPrice",
                              toNullableNumber(e.target.value),
                            )
                          }
                          placeholder="Unit"
                        />
                      </Table.Cell>

                      <Table.Cell textAlign="right">
                        <Input
                          size="xs"
                          type="number"
                          value={item.amount ?? ""}
                          onChange={(e) =>
                            updateLineItem(
                              i,
                              "amount",
                              toNullableNumber(e.target.value),
                            )
                          }
                          placeholder="Amount"
                        />
                      </Table.Cell>

                      <Table.Cell textAlign="right">
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => removeLineItem(i)}
                        >
                          <Minus size={14} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={5}>
                      <Text fontSize="xs" color="gray.500">
                        No line items extracted. Add one manually if needed.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
            <Button size="sm" variant="outline" mt={3} onClick={addLineItem}>
              <Plus size={14} />
              Add Line Item
            </Button>
          </Box>

          <Box bg="gray.50" p={4} borderRadius="md">
            <VStack align="stretch" gap={3}>
              <SimpleGrid columns={3} gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                    SUBTOTAL
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={editForm.subtotal ?? ""}
                    onChange={(e) =>
                      updateField("subtotal", toNullableNumber(e.target.value))
                    }
                    placeholder="Subtotal"
                  />
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                    TAX
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={editForm.tax ?? ""}
                    onChange={(e) =>
                      updateField("tax", toNullableNumber(e.target.value))
                    }
                    placeholder="Tax"
                  />
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                    TOTAL
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    value={editForm.total ?? ""}
                    onChange={(e) =>
                      updateField("total", toNullableNumber(e.target.value))
                    }
                    placeholder="Total"
                  />
                </Box>
              </SimpleGrid>

              <Text fontSize="xs" color="gray.500">
                Validation will run again after saving corrections.
              </Text>
            </VStack>
          </Box>

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

        <SimpleGrid columns={4} gap={3} pt={4}>
          <Button
            w="full"
            colorPalette="green"
            loading={saving}
            onClick={saveCorrections}
          >
            <Save size={16} />
            Save Corrections
          </Button>{" "}
          <Button
            w="full"
            colorPalette="blue"
            onClick={() => updateDoc(selectedDoc._id, { status: "validated" })}
          >
            <CheckCircle2 size={16} />
            Confirm & Validate
          </Button>
          <Button
            w="full"
            variant="outline"
            colorPalette="red"
            onClick={() => updateDoc(selectedDoc._id, { status: "rejected" })}
          >
            <XCircle size={16} />
            Reject
          </Button>
          <Button
            w="full"
            variant="ghost"
            colorPalette="red"
            onClick={() => deleteDoc(selectedDoc._id)}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
