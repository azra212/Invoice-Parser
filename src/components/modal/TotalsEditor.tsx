import { Box, Input, SimpleGrid, Text, VStack } from "@chakra-ui/react";

interface TotalsEditorProps {
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  onSubtotalChange: (value: number | null) => void;
  onTaxChange: (value: number | null) => void;
  onTotalChange: (value: number | null) => void;
  toNullableNumber: (value: string) => number | null;
}

export function TotalsEditor({
  subtotal,
  tax,
  total,
  onSubtotalChange,
  onTaxChange,
  onTotalChange,
  toNullableNumber,
}: TotalsEditorProps) {
  return (
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
              value={subtotal ?? ""}
              onChange={(e) =>
                onSubtotalChange(toNullableNumber(e.target.value))
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
              value={tax ?? ""}
              onChange={(e) => onTaxChange(toNullableNumber(e.target.value))}
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
              value={total ?? ""}
              onChange={(e) => onTotalChange(toNullableNumber(e.target.value))}
              placeholder="Total"
            />
          </Box>
        </SimpleGrid>

        <Text fontSize="xs" color="gray.500">
          Validation will run again after saving corrections.
        </Text>
      </VStack>
    </Box>
  );
}
