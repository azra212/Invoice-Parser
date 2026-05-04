import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
} from "@chakra-ui/react";
import { AlertCircle } from "lucide-react";
import { ProcessedDocument } from "../backend/models/documentTypes";
import { DocumentReviewModal } from "./components/modal/DocumentReviewModal";

import {
  fetchDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
} from "./api/documentApi";
import { Navbar } from "./components/Navbar";
import { StatsCards } from "./components/StatsCards";
import { EmptyDocumentsState } from "./components/EmptyDocumentsState";
import { DocumentTable } from "./components/DocumentTable";

export default function App() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);

  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(
    null,
  );

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openFileUpload = () => {
    document.getElementById("file-upload")?.click();
  };

  const fetchDocs = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocuments([]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const uploadedDoc = await uploadDocument(file);

      setDocuments((prev) => [uploadedDoc, ...prev]);
      setSelectedDoc(uploadedDoc);
    } catch (error) {
      console.error("Upload failed:", error);

      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not upload the document. Please try again.",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updateDoc = async (id: string, updates: Partial<ProcessedDocument>) => {
    try {
      setActionError(null);

      const updatedDoc = await updateDocument(id, updates);

      setDocuments((prev) =>
        prev.map((doc) => {
          const docId = doc._id ?? doc.id;
          return docId === id ? updatedDoc : doc;
        }),
      );

      setSelectedDoc(updatedDoc);
    } catch (error) {
      console.error("Update failed:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Could not update the document. Please try again.",
      );
    }
  };

  const deleteDoc = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this document?")) return;

    try {
      setActionError(null);

      await deleteDocument(id);

      setDocuments((prev) =>
        prev.filter((doc) => {
          const docId = doc._id ?? doc.id;
          return docId !== id;
        }),
      );

      const selectedDocId = selectedDoc?._id ?? selectedDoc?.id;

      if (selectedDocId === id) {
        setSelectedDoc(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Could not delete the document. Please try again.",
      );
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
        <Navbar onUploadClick={openFileUpload} />
        <Container maxW="6xl" py={8}>
          <VStack gap={8} align="start">
            <Box w="full">
              <HStack justify="space-between">
                <Box>
                  <Heading size="lg">Document Workspace</Heading>
                  <Text color="gray.600">
                    Upload invoices and documents to extract, review, and manage
                    structured data.
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
            )}
            <StatsCards documents={documents} />
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
                      onClick={() => openFileUpload()}
                      disabled={uploading}
                    >
                      {uploading ? "Processing..." : "Upload Document"}
                    </Button>
                  </HStack>
                </HStack>
              </Box>

              <Box p={6}>
                {documents.length === 0 ? (
                  <EmptyDocumentsState onUploadClick={openFileUpload} />
                ) : (
                  <DocumentTable
                    documents={documents}
                    onReview={(doc) => {
                      setActionError(null);
                      setSelectedDoc(doc);
                    }}
                    onDelete={deleteDoc}
                  />
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
        )}
      </Box>
    </ChakraProvider>
  );
}
