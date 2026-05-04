import { Box, Button, Heading, HStack } from "@chakra-ui/react";
import { ClipboardList } from "lucide-react";

interface NavbarProps {
  onUploadClick: () => void;
}

export function Navbar({ onUploadClick }: NavbarProps) {
  return (
    <Box
      px={8}
      py={4}
      borderBottom="1px solid"
      borderColor="gray.200"
      bg="white"
    >
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
}
