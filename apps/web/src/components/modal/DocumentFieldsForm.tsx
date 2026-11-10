import { Box, Input, NativeSelect, SimpleGrid, Text } from "@chakra-ui/react";
import type {
  ProcessedDocument,
  ValidationIssue,
} from "@invoice-parser/shared";

type EditableDocumentMainFields = Pick<
  ProcessedDocument,
  | "documentType"
  | "supplierName"
  | "documentNumber"
  | "issueDate"
  | "dueDate"
  | "currency"
>;

interface DocumentFieldsFormProps {
  values: EditableDocumentMainFields;
  issues?: ValidationIssue[];
  confidence?: Record<string, number>;
  onFieldChange: <K extends keyof EditableDocumentMainFields>(
    field: K,
    value: EditableDocumentMainFields[K],
  ) => void;
}

function issueFor(issues: ValidationIssue[] | undefined, field: string) {
  return issues?.find((issue) => issue.field === field);
}

export function DocumentFieldsForm({
  values,
  issues,
  confidence,
  onFieldChange,
}: DocumentFieldsFormProps) {
  const tone = (field: string) => {
    const issue = issueFor(issues, field);
    if (issue?.severity === "error") return "red.500";
    if (issue?.severity === "warning") return "orange.400";
    if ((confidence?.[field] ?? 1) < 0.6) return "yellow.400";
    return undefined;
  };
  const note = (field: string) => {
    const issue = issueFor(issues, field);
    const low = (confidence?.[field] ?? 1) < 0.6;
    if (!issue && !low) return null;
    return (
      <Text
        fontSize="xs"
        mt={1}
        color={issue?.severity === "error" ? "red.600" : "orange.700"}
      >
        {issue?.message ?? "Low confidence"}
      </Text>
    );
  };
  return (
    <SimpleGrid columns={2} gap={4}>
      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          TYPE
        </Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            borderColor={tone("documentType")}
            value={values.documentType ?? ""}
            onChange={(e) =>
              onFieldChange(
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
        {note("documentType")}
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          NUMBER
        </Text>
        <Input
          size="sm"
          borderColor={tone("documentNumber")}
          aria-label="Document number"
          value={values.documentNumber ?? ""}
          onChange={(e) => onFieldChange("documentNumber", e.target.value)}
          placeholder="Document number"
        />
        {note("documentNumber")}
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          SUPPLIER
        </Text>
        <Input
          size="sm"
          borderColor={tone("supplierName")}
          aria-label="Supplier"
          value={values.supplierName ?? ""}
          onChange={(e) => onFieldChange("supplierName", e.target.value)}
          placeholder="Supplier name"
        />
        {note("supplierName")}
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          ISSUE DATE
        </Text>
        <Input
          size="sm"
          borderColor={tone("issueDate")}
          aria-label="Issue date"
          value={values.issueDate ?? ""}
          onChange={(e) => onFieldChange("issueDate", e.target.value)}
          placeholder="YYYY-MM-DD"
        />
        {note("issueDate")}
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          DUE DATE
        </Text>
        <Input
          size="sm"
          borderColor={tone("dueDate")}
          aria-label="Due date"
          value={values.dueDate ?? ""}
          onChange={(e) => onFieldChange("dueDate", e.target.value)}
          placeholder="YYYY-MM-DD"
        />
        {note("dueDate")}
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          CURRENCY
        </Text>
        <Input
          size="sm"
          borderColor={tone("currency")}
          aria-label="Currency"
          value={values.currency ?? ""}
          onChange={(e) => onFieldChange("currency", e.target.value)}
          placeholder="USD"
        />
        {note("currency")}
      </Box>
    </SimpleGrid>
  );
}
