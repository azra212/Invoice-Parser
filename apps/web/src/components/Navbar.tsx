import { Box, Button, Heading, HStack, Text } from "@chakra-ui/react";
import { ClipboardList } from "lucide-react";

interface NavbarProps {
  onUploadClick: () => void;
  email?: string;
  onLogout: () => void;
}

export function Navbar({ onUploadClick, email, onLogout }: NavbarProps) {
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
          {email && (
            <Text fontSize="sm" color="gray.600">
              {email}
            </Text>
          )}
          <Button size="sm" variant="ghost" onClick={onLogout}>
            Sign out
          </Button>
          <Button size="sm" colorPalette="blue" onClick={onUploadClick}>
            New Upload
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
}
