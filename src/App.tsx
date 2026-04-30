import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Badge,
  Table,
} from "@chakra-ui/react";
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  History,
} from "lucide-react";
import { ProcessedDocument } from "../backend/models/documentTypes";
import { DocumentReviewModal } from "./components/DocumentReviewModal";

// Component placeholders for now
const Navbar = ({ onUploadClick }: { onUploadClick: () => void }) => (
  <Box px={8} py={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
    <HStack justify="space-between">
      <HStack gap={2}>
        <Box bg="blue.600" p={2} borderRadius="md" color="white">
          <ClipboardList size={20} />
        </Box>
        <Heading size="md" fontWeight="bold" letterSpacing="tight">
          Invoice Parser
        </Heading>
      </HStack>
      <HStack gap={4}>
        <Button size="sm" variant="ghost">
          Dashboard
        </Button>
        <Button size="sm" variant="ghost">
          History
        </Button>
        <Button size="sm" colorPalette="blue" onClick={onUploadClick}>
          New Upload
        </Button>
      </HStack>
    </HStack>
  </Box>
);

const Stats = ({ docs }: { docs: ProcessedDocument[] }) => {
  const needsReview = docs.filter((d) => d.status === "needs_review").length;
  const validated = docs.filter((d) => d.status === "validated").length;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full">
      <Box
        p={6}
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        bg="white"
      >
        <VStack align="start" gap={1}>
          <Text
            fontSize="xs"
            color="gray.500"
            textTransform="uppercase"
            fontWeight="bold"
          >
            Total Processed
          </Text>
          <Heading size="xl">{docs.length}</Heading>
        </VStack>
      </Box>
      <Box
        p={6}
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        bg="white"
      >
        <VStack align="start" gap={1}>
          <Text
            fontSize="xs"
            color="gray.500"
            textTransform="uppercase"
            fontWeight="bold"
          >
            Needs Review
          </Text>
          <HStack gap={2}>
            <Heading size="xl" color="orange.500">
              {needsReview}
            </Heading>
            <AlertCircle size={20} color="orange" />
          </HStack>
        </VStack>
      </Box>
      <Box
        p={6}
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        bg="white"
      >
        <VStack align="start" gap={1}>
          <Text
            fontSize="xs"
            color="gray.500"
            textTransform="uppercase"
            fontWeight="bold"
          >
            Validated
          </Text>
          <HStack gap={2}>
            <Heading size="xl" color="green.500">
              {validated}
            </Heading>
            <CheckCircle2 size={20} color="green" />
          </HStack>
        </VStack>
      </Box>
    </SimpleGrid>
  );
};

export default function App() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Helpers

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

  const fetchDocs = async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();

    if (data.success) {
      setDocuments(data.data);
    } else {
      console.error("Failed to fetch documents", data);
      setDocuments([]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(
          data.message ||
            data.error?.message ||
            data.error ||
            "Document upload failed. Please try again with another file.",
        );
        return;
      }

      const uploadedDoc = data.data;
      setDocuments((prev) => [uploadedDoc, ...prev]);
      setSelectedDoc(uploadedDoc);
    } catch (err) {
      console.error(err);
      setUploadError(
        "Could not upload the document. Please check your connection and try again.",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updateDoc = async (id: string, updates: Partial<ProcessedDocument>) => {
    try {
      setActionError(null);

      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionError(
          data.message ||
            data.error?.message ||
            "Failed to update document. Please try again.",
        );
        return;
      }

      const updatedDoc = data.data;

      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? updatedDoc : doc)),
      );

      setSelectedDoc(updatedDoc);
    } catch (error) {
      console.error("Update failed:", error);

      setActionError(
        "Could not connect to the server while updating the document.",
      );
    }
  };
  const deleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) {
        console.error("Delete failed", data);
        return;
      }

      // remove from list
      setDocuments((prev) => prev.filter((d) => d._id !== id));

      // close drawer if deleted doc is open
      if (selectedDoc?._id === id) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <ChakraProvider value={defaultSystem}>
      <Box minH="100vh" bg="gray.50">
        <input
          type="file"
          id="file-upload"
          style={{ display: "none" }}
          onChange={handleUpload}
          accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
        />
        <Navbar
          onUploadClick={() => document.getElementById("file-upload")?.click()}
        />
        <Container maxW="6xl" py={8}>
          <VStack gap={8} align="start">
            <Box w="full">
              <HStack justify="space-between">
                <Box>
                  <Heading size="lg">Document Workspace</Heading>
                  <Text color="gray.600">
                    Extracting intelligence from your business documents.
                  </Text>
                </Box>
                {uploading && (
                  <Badge colorPalette="blue" px={4} py={2} borderRadius="full">
                    Processing Document...
                  </Badge>
                )}
              </HStack>
            </Box>
            {uploadError && (
              <Box
                w="full"
                p={4}
                bg="red.50"
                border="1px solid"
                borderColor="red.100"
                borderRadius="md"
              >
                <HStack align="start" gap={3}>
                  <AlertCircle size={18} color="red" />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="red.700">
                      Upload failed
                    </Text>
                    <Text fontSize="sm" color="red.700">
                      {uploadError}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            )}{" "}
            <Stats docs={documents} />
            <Box
              w="full"
              bg="white"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.100"
              overflow="hidden"
            >
              <Box p={6} borderBottom="1px solid" borderColor="gray.50">
                <HStack justify="space-between">
                  <Heading size="md">Recent Documents</Heading>
                  <HStack>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      disabled={uploading}
                    >
                      {uploading ? "Processing..." : "Upload Document"}
                    </Button>
                  </HStack>
                </HStack>
              </Box>

              <Box p={6}>
                {documents.length === 0 ? (
                  <VStack py={12} gap={4}>
                    <Box color="gray.200">
                      <History size={48} />
                    </Box>
                    <Text color="gray.500">
                      No documents processed yet. Start by uploading an invoice
                      or PO.
                    </Text>
                    <Button
                      colorPalette="blue"
                      size="md"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      Upload First Document
                    </Button>
                  </VStack>
                ) : (
                  <Table.Root size="sm" variant="line">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Document Number</Table.ColumnHeader>
                        <Table.ColumnHeader>Supplier</Table.ColumnHeader>
                        <Table.ColumnHeader>Issue Date</Table.ColumnHeader>
                        <Table.ColumnHeader>Due Date</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          Subtotal
                        </Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          Tax
                        </Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          Total
                        </Table.ColumnHeader>
                        <Table.ColumnHeader>Currency</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          Actions
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {documents?.map((doc) => (
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

                          <Table.Cell fontSize="sm">
                            {displayValue(doc.issueDate)}
                          </Table.Cell>

                          <Table.Cell fontSize="sm">
                            {displayValue(doc.dueDate)}
                          </Table.Cell>

                          <Table.Cell fontSize="sm" textAlign="right">
                            {displayMoney(doc.subtotal)}
                          </Table.Cell>

                          <Table.Cell fontSize="sm" textAlign="right">
                            {displayMoney(doc.tax)}
                          </Table.Cell>

                          <Table.Cell
                            fontSize="sm"
                            fontWeight="bold"
                            textAlign="right"
                          >
                            {displayMoney(doc.total)}
                          </Table.Cell>

                          <Table.Cell fontSize="sm">
                            {displayValue(doc.currency)}
                          </Table.Cell>

                          <Table.Cell>
                            <VStack align="start" gap={1}>
                              <Badge
                                colorPalette={
                                  doc.status === "validated"
                                    ? "green"
                                    : doc.status === "needs_review"
                                      ? "orange"
                                      : doc.status === "rejected"
                                        ? "red"
                                        : "gray"
                                }
                              >
                                {formatStatus(doc.status)}
                              </Badge>

                              <Text fontSize="xs" color="gray.500">
                                {issueCount(doc)} issue
                                {issueCount(doc) === 1 ? "" : "s"}
                              </Text>
                            </VStack>
                          </Table.Cell>

                          <Table.Cell textAlign="right">
                            <HStack justify="flex-end">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => {
                                  setActionError(null);
                                  setSelectedDoc(doc);
                                }}
                              >
                                Review
                              </Button>

                              <Button
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={() => deleteDoc(doc._id)}
                              >
                                Delete
                              </Button>
                            </HStack>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </Box>
            </Box>
          </VStack>
        </Container>
        {selectedDoc && (
          <DocumentReviewModal
            selectedDoc={selectedDoc}
            onClose={() => {
              setActionError(null);
              setSelectedDoc(null);
            }}
            updateDoc={updateDoc}
            deleteDoc={deleteDoc}
            actionError={actionError}
          />
        )}{" "}
      </Box>
    </ChakraProvider>
  );
}
