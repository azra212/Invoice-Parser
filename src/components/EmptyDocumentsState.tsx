import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { History } from "lucide-react";

interface EmptyDocumentsStateProps {
  onUploadClick: () => void;
}

export function EmptyDocumentsState({
  onUploadClick,
}: EmptyDocumentsStateProps) {
  return (
    <VStack py={12} gap={4}>
      <Box color="gray.200">
        <History size={48} />
      </Box>

      <Text color="gray.500">
        No documents processed yet. Start by uploading an invoice or PO.
      </Text>

      <Button colorPalette="blue" size="md" onClick={onUploadClick}>
        Upload First Document
      </Button>
    </VStack>
  );
}
