import {
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Trash2,
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
} from "@chakra-ui/react";
import { ProcessedDocument } from "../../backend/models/documentTypes";

type DocumentReviewModalProps = {
  selectedDoc: any;
  onClose: () => void;
  updateDoc: (id: string, updates: Partial<ProcessedDocument>) => Promise<void>;
  deleteDoc: (id: string) => Promise<void>;
};

export function DocumentReviewModal({
  selectedDoc,
  onClose,
  updateDoc,
  deleteDoc,
}: DocumentReviewModalProps) {
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("View original file clicked", selectedDoc);
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

        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={2} gap={4}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                TYPE
              </Text>
              <Text fontSize="sm">
                {formatStatus(selectedDoc.documentType)}
              </Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                NUMBER
              </Text>
              <Text fontSize="sm">
                {displayValue(selectedDoc.documentNumber)}
              </Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                SUPPLIER
              </Text>
              <Text fontSize="sm">
                {displayValue(selectedDoc.supplierName)}
              </Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                ISSUE DATE
              </Text>
              <Text fontSize="sm">{displayValue(selectedDoc.issueDate)}</Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                DUE DATE
              </Text>
              <Text fontSize="sm">{displayValue(selectedDoc.dueDate)}</Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                CURRENCY
              </Text>
              <Text fontSize="sm">{displayValue(selectedDoc.currency)}</Text>
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
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {selectedDoc.lineItems?.length > 0 ? (
                  selectedDoc.lineItems.map((item: any, i: number) => (
                    <Table.Row key={i}>
                      <Table.Cell fontSize="xs">
                        {displayValue(item.description)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" textAlign="right">
                        {displayValue(item.quantity)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" textAlign="right">
                        {displayMoney(item.unitPrice)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" textAlign="right">
                        {displayMoney(item.amount)}
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={4}>
                      <Text fontSize="xs" color="gray.500">
                        No line items extracted.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>

          <Box bg="gray.50" p={4} borderRadius="md">
            <VStack align="stretch" gap={2}>
              <HStack justify="space-between">
                <Text fontSize="sm">Subtotal</Text>
                <Text fontSize="sm">{displayMoney(selectedDoc.subtotal)}</Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm">Tax</Text>
                <Text fontSize="sm">{displayMoney(selectedDoc.tax)}</Text>
              </HStack>

              <HStack
                justify="space-between"
                pt={2}
                borderTop="1px solid"
                borderColor="gray.200"
              >
                <Text fontWeight="bold">Total</Text>
                <Text fontWeight="bold">
                  {displayValue(selectedDoc.currency)}{" "}
                  {displayMoney(selectedDoc.total)}
                </Text>
              </HStack>
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

        <SimpleGrid columns={3} gap={3} pt={4}>
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
