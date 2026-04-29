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
  useDisclosure,
  createListCollection,
} from "@chakra-ui/react";
import {
  FileUp,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  History,
} from "lucide-react";
import { ProcessedDocument } from "../backend/models/documentTypes";

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

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const uploadedDoc = data.success ? data.data : data;
        setDocuments((prev) => [uploadedDoc, ...prev]);
        setSelectedDoc(uploadedDoc);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const updateDoc = async (id: string, updates: Partial<ProcessedDocument>) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!data.success) {
        console.error("Update failed", data);
        return;
      }

      const updatedDoc = data.data;

      setDocuments((prev) => prev.map((d) => (d._id === id ? updatedDoc : d)));

      setSelectedDoc(updatedDoc);
    } catch (err) {
      console.error(err);
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
                        <Table.ColumnHeader>Document</Table.ColumnHeader>
                        <Table.ColumnHeader>Supplier</Table.ColumnHeader>
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        <Table.ColumnHeader>Amount</Table.ColumnHeader>
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
                                {doc.documentNumber || "UNNAMED"}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {doc.fileName}
                              </Text>
                            </VStack>
                          </Table.Cell>
                          <Table.Cell fontSize="sm">
                            {doc.supplierName}
                          </Table.Cell>
                          <Table.Cell fontSize="sm">{doc.issueDate}</Table.Cell>
                          <Table.Cell fontSize="sm" fontWeight="bold">
                            {doc.currency || ""}{" "}
                            {doc.total?.toLocaleString?.() ?? "—"}{" "}
                          </Table.Cell>
                          <Table.Cell>
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
                              {doc.status.replace("_", " ")}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <HStack justify="flex-end">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setSelectedDoc(doc)}
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

        {/* Selected Doc Overlay (Simulating a Drawer) */}
        {selectedDoc && (
          <Box
            position="fixed"
            right={0}
            top={0}
            h="100vh"
            w="500px"
            bg="white"
            shadow="2xl"
            zIndex={100}
            borderLeft="1px solid"
            borderColor="gray.100"
            p={8}
            overflowY="auto"
          >
            <VStack align="stretch" gap={6}>
              <HStack justify="space-between">
                <Heading size="md">Review Document</Heading>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDoc(null)}
                >
                  Close
                </Button>
              </HStack>

              {selectedDoc.validationIssues.length > 0 && (
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
                    {selectedDoc.validationIssues.map((issue, i) => (
                      <Text key={i} fontSize="xs" color="orange.800">
                        • {issue.message}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              )}

              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500">
                    SUPPLIER
                  </Text>
                  <Text fontSize="md" fontWeight="medium">
                    {selectedDoc.supplierName}
                  </Text>
                </Box>
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">
                      TYPE
                    </Text>
                    <Text fontSize="sm">
                      {selectedDoc.documentType.replace("_", " ")}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">
                      NUMBER
                    </Text>
                    <Text fontSize="sm">{selectedDoc.documentNumber}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">
                      ISSUE DATE
                    </Text>
                    <Text fontSize="sm">{selectedDoc.issueDate}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">
                      CURRENCY
                    </Text>
                    <Text fontSize="sm">{selectedDoc.currency}</Text>
                  </Box>
                </SimpleGrid>

                <Box mt={4}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>
                    LINE ITEMS
                  </Text>
                  <Table.Root size="sm" variant="outline">
                    <Table.Header bg="gray.50">
                      <Table.Row>
                        <Table.ColumnHeader>Desc</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          Qty
                        </Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          Total
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {selectedDoc.lineItems.map((item, i) => (
                        <Table.Row key={i}>
                          <Table.Cell fontSize="xs">
                            {item.description}
                          </Table.Cell>
                          <Table.Cell fontSize="xs" textAlign="right">
                            {item.quantity}
                          </Table.Cell>
                          <Table.Cell fontSize="xs" textAlign="right">
                            {item.amount}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <VStack align="stretch" gap={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Subtotal</Text>
                      <Text fontSize="sm">{selectedDoc.subtotal}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Tax</Text>
                      <Text fontSize="sm">{selectedDoc.tax}</Text>
                    </HStack>
                    <HStack
                      justify="space-between"
                      pt={2}
                      borderTop="1px solid"
                      borderColor="gray.200"
                    >
                      <Text fontWeight="bold">Total</Text>
                      <Text fontWeight="bold">
                        {selectedDoc.currency} {selectedDoc.total}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>

              <HStack gap={4} pt={4}>
                <Button
                  w="full"
                  colorPalette="blue"
                  onClick={() =>
                    updateDoc(selectedDoc._id, { status: "validated" })
                  }
                >
                  Confirm & Validate
                </Button>
                <Button
                  w="full"
                  variant="outline"
                  colorPalette="red"
                  onClick={() =>
                    updateDoc(selectedDoc._id, { status: "rejected" })
                  }
                >
                  Reject
                </Button>
                <Button
                  w="full"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => deleteDoc(selectedDoc._id)}
                >
                  Delete
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}
      </Box>
    </ChakraProvider>
  );
}
