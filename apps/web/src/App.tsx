import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Input,
  NativeSelect,
} from "@chakra-ui/react";
import { AlertCircle } from "lucide-react";
import type { ProcessedDocument } from "@invoice-parser/shared";
import { DocumentReviewModal } from "./components/modal/DocumentReviewModal";

import {
  fetchDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  reprocessDocument,
  downloadDocuments,
} from "./api/documentApi";
import { AuthScreen } from "./components/AuthScreen";
import { Navbar } from "./components/Navbar";
import { currentUser, logoutAccount, type SessionUser } from "./api/authApi";
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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const openFileUpload = () => {
    document.getElementById("file-upload")?.click();
  };

  const fetchDocs = useCallback(async () => {
    try {
      const result = await fetchDocuments({
        status: statusFilter || undefined,
        q: search.trim() || undefined,
        page,
      });
      setDocuments(result.documents);
      setTotal(result.total);
      setCounts(result.counts);
      setSelectedDoc((current) => {
        if (!current) return current;
        const id = current._id ?? current.id;
        return (
          result.documents.find((doc) => (doc._id ?? doc.id) === id) ?? current
        );
      });
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocuments([]);
    }
  }, [page, search, statusFilter]);

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
      setPendingDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Could not delete the document. Please try again.",
      );
    }
  };

  const waitingForProcessing = documents.some(
    (doc) => doc.status === "uploaded" || doc.status === "processing",
  );

  const reprocessDoc = async (id: string) => {
    try {
      setActionError(null);
      const updated = await reprocessDocument(id);
      setDocuments((prev) =>
        prev.map((doc) => ((doc._id ?? doc.id) === id ? updated : doc)),
      );
      setSelectedDoc(updated);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not reprocess the document.",
      );
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("invoice-parser-theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("invoice-parser-theme", theme);
  }, [theme]);

  useEffect(() => {
    void currentUser()
      .then(setUser)
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchDocs();
  }, [fetchDocs, user]);

  useEffect(() => {
    if (!waitingForProcessing) return;
    const timer = window.setInterval(() => {
      void fetchDocs();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [waitingForProcessing, fetchDocs]);

  if (!authReady) {
    return null;
  }

  if (!user) {
    return (
      <ChakraProvider value={defaultSystem}>
        <AuthScreen onSuccess={setUser} />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider value={defaultSystem}>
      <Box minH="100vh" bg={{ base: "gray.50", _dark: "gray.900" }}>
        <input
          type="file"
          id="file-upload"
          style={{ display: "none" }}
          onChange={handleUpload}
          accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
        />
        <Navbar
          onUploadClick={openFileUpload}
          email={user.email}
          theme={theme}
          onToggleTheme={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
          onLogout={() => {
            void logoutAccount().finally(() => {
              setUser(null);
              setDocuments([]);
              setSelectedDoc(null);
            });
          }}
        />
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
            <StatsCards counts={counts} />
            {pendingDelete && (
              <HStack
                w="full"
                p={4}
                bg="red.50"
                borderWidth="1px"
                borderColor="red.100"
                borderRadius="md"
                justify="space-between"
              >
                <Text fontSize="sm">Delete this document permanently?</Text>
                <HStack>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="red"
                    onClick={() => void deleteDoc(pendingDelete)}
                  >
                    Delete
                  </Button>
                </HStack>
              </HStack>
            )}
            <Box
              w="full"
              bg="white"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.100"
              overflow="hidden"
            >
              <Box p={6} borderBottom="1px solid" borderColor="gray.50">
                <HStack justify="space-between" wrap="wrap" gap={3}>
                  <Heading size="md">Documents</Heading>
                  <HStack wrap="wrap">
                    <Input
                      aria-label="Search documents"
                      size="sm"
                      placeholder="Search supplier or number"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      maxW="240px"
                    />
                    <NativeSelect.Root size="sm" width="160px">
                      <NativeSelect.Field
                        aria-label="Filter by status"
                        value={statusFilter}
                        onChange={(event) => {
                          setStatusFilter(event.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="">All statuses</option>
                        <option value="needs_review">Needs review</option>
                        <option value="validated">Validated</option>
                        <option value="rejected">Rejected</option>
                        <option value="failed">Failed</option>
                        <option value="processing">Processing</option>
                        <option value="uploaded">Uploaded</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void downloadDocuments("csv", {
                          status: statusFilter || undefined,
                          q: search.trim() || undefined,
                        })
                      }
                    >
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void downloadDocuments("json", {
                          status: statusFilter || undefined,
                          q: search.trim() || undefined,
                        })
                      }
                    >
                      Export JSON
                    </Button>
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
                    onDelete={setPendingDelete}
                  />
                )}
                <HStack justify="space-between" pt={4}>
                  <Text fontSize="sm" color="gray.500">
                    {total} document{total === 1 ? "" : "s"}
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm">Page {page}</Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={page * 20 >= total}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </Button>
                  </HStack>
                </HStack>
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
            reprocessDoc={reprocessDoc}
            actionError={actionError}
          />
        )}
      </Box>
    </ChakraProvider>
  );
}
