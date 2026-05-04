import { Box, Input, NativeSelect, SimpleGrid, Text } from "@chakra-ui/react";
import type { ProcessedDocument } from "../../../backend/models/documentTypes";

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
  onFieldChange: <K extends keyof EditableDocumentMainFields>(
    field: K,
    value: EditableDocumentMainFields[K],
  ) => void;
}

export function DocumentFieldsForm({
  values,
  onFieldChange,
}: DocumentFieldsFormProps) {
  return (
    <SimpleGrid columns={2} gap={4}>
      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          TYPE
        </Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
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
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          NUMBER
        </Text>
        <Input
          size="sm"
          value={values.documentNumber ?? ""}
          onChange={(e) => onFieldChange("documentNumber", e.target.value)}
          placeholder="Document number"
        />
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          SUPPLIER
        </Text>
        <Input
          size="sm"
          value={values.supplierName ?? ""}
          onChange={(e) => onFieldChange("supplierName", e.target.value)}
          placeholder="Supplier name"
        />
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          ISSUE DATE
        </Text>
        <Input
          size="sm"
          value={values.issueDate ?? ""}
          onChange={(e) => onFieldChange("issueDate", e.target.value)}
          placeholder="YYYY-MM-DD"
        />
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          DUE DATE
        </Text>
        <Input
          size="sm"
          value={values.dueDate ?? ""}
          onChange={(e) => onFieldChange("dueDate", e.target.value)}
          placeholder="YYYY-MM-DD"
        />
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
          CURRENCY
        </Text>
        <Input
          size="sm"
          value={values.currency ?? ""}
          onChange={(e) => onFieldChange("currency", e.target.value)}
          placeholder="USD"
        />
      </Box>
    </SimpleGrid>
  );
}
