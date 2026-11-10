import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";

export function DocumentPreview({
  documentId,
  mimeType,
}: {
  documentId: string;
  mimeType?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setFailed(false);
    setText(null);
    setUrl(null);

    void fetch(`/api/v1/documents/${documentId}/original`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("missing");
        const blob = await response.blob();
        const type = mimeType || blob.type;
        if (type.startsWith("text/") || type === "application/csv") {
          const content = await blob.text();
          if (!cancelled) setText(content);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, mimeType]);

  if (failed) {
    return <Text fontSize="sm">The original file could not be loaded.</Text>;
  }

  if (text !== null) {
    return (
      <Box
        as="pre"
        whiteSpace="pre-wrap"
        fontSize="sm"
        bg="gray.50"
        p={4}
        borderRadius="md"
        maxH="70vh"
        overflow="auto"
      >
        {text}
      </Box>
    );
  }

  if (!url) {
    return <Text fontSize="sm">Loading original…</Text>;
  }

  if (mimeType?.startsWith("image/")) {
    return (
      <img
        src={url}
        alt="Original document"
        style={{ maxWidth: "100%", maxHeight: "70vh" }}
      />
    );
  }

  return (
    <iframe
      title="Original document"
      src={url}
      style={{ width: "100%", height: "70vh", border: 0 }}
    />
  );
}
