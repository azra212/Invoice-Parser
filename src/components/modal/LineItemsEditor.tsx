import { Minus, Plus } from "lucide-react";
import { Box, Button, Input, Table, Text } from "@chakra-ui/react";
import type { LineItem } from "../../../backend/models/documentTypes";

interface LineItemsEditorProps {
  lineItems: LineItem[];
  onChange: <K extends keyof LineItem>(
    index: number,
    field: K,
    value: LineItem[K],
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  toNullableNumber: (value: string) => number | null;
}

export function LineItemsEditor({
  lineItems,
  onChange,
  onAdd,
  onRemove,
  toNullableNumber,
}: LineItemsEditorProps) {
  return (
    <Box mt={4}>
      <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>
        LINE ITEMS
      </Text>

      <Table.Root size="sm" variant="outline">
        <Table.Header bg="gray.50">
          <Table.Row>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">Quantity</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">
              Unit Price
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">Amount</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {lineItems.length > 0 ? (
            lineItems.map((item, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  <Input
                    size="xs"
                    value={item.description ?? ""}
                    onChange={(e) =>
                      onChange(index, "description", e.target.value)
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
                      onChange(
                        index,
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
                      onChange(
                        index,
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
                      onChange(
                        index,
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
                    onClick={() => onRemove(index)}
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

      <Button size="sm" variant="outline" mt={3} onClick={onAdd}>
        <Plus size={14} />
        Add Line Item
      </Button>
    </Box>
  );
}
