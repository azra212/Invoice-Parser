import { Badge, Button, HStack, Table, Text, VStack } from "@chakra-ui/react";
import type { ProcessedDocument } from "../../backend/models/documentTypes";
import {
  displayMoney,
  displayValue,
  formatStatus,
} from "../utils/documentFormatters";
import { getIssueCount, getStatusColor } from "../utils/documentStatus";

interface DocumentTableProps {
  documents: ProcessedDocument[];
  onReview: (doc: ProcessedDocument) => void;
  onDelete: (id: string) => void;
}

export function DocumentTable({
  documents,
  onReview,
  onDelete,
}: DocumentTableProps) {
  return (
    <Table.Root size="sm" variant="line">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Document Number</Table.ColumnHeader>
          <Table.ColumnHeader>Supplier</Table.ColumnHeader>
          <Table.ColumnHeader>Issue Date</Table.ColumnHeader>
          <Table.ColumnHeader>Due Date</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="right">Subtotal</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="right">Tax</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="right">Total</Table.ColumnHeader>
          <Table.ColumnHeader>Currency</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {documents.map((doc) => (
          <Table.Row key={doc._id}>
            <Table.Cell>
              <VStack align="start" gap={0}>
                <Text fontWeight="medium" fontSize="sm">
                  {displayValue(doc.documentNumber)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {displayValue(doc.fileName)}
                </Text>
              </VStack>
            </Table.Cell>

            <Table.Cell fontSize="sm">
              {displayValue(doc.supplierName)}
            </Table.Cell>

            <Table.Cell fontSize="sm">{displayValue(doc.issueDate)}</Table.Cell>

            <Table.Cell fontSize="sm">{displayValue(doc.dueDate)}</Table.Cell>

            <Table.Cell fontSize="sm" textAlign="right">
              {displayMoney(doc.subtotal)}
            </Table.Cell>

            <Table.Cell fontSize="sm" textAlign="right">
              {displayMoney(doc.tax)}
            </Table.Cell>

            <Table.Cell fontSize="sm" fontWeight="bold" textAlign="right">
              {displayMoney(doc.total)}
            </Table.Cell>

            <Table.Cell fontSize="sm">{displayValue(doc.currency)}</Table.Cell>

            <Table.Cell>
              <VStack align="start" gap={1}>
                <Badge colorPalette={getStatusColor(doc.status)}>
                  {formatStatus(doc.status)}
                </Badge>

                <Text fontSize="xs" color="gray.500">
                  {getIssueCount(doc)} issue
                  {getIssueCount(doc) === 1 ? "" : "s"}
                </Text>
              </VStack>
            </Table.Cell>

            <Table.Cell textAlign="right">
              <HStack justify="flex-end">
                <Button size="xs" variant="ghost" onClick={() => onReview(doc)}>
                  Review
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => onDelete(doc._id)}
                >
                  Delete
                </Button>
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
