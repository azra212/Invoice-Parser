import { AlertCircle } from "lucide-react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import type { ValidationIssue } from "../../../backend/models/documentTypes";

interface ValidationIssuesBoxProps {
  issues: ValidationIssue[];
}

export function ValidationIssuesBox({ issues }: ValidationIssuesBoxProps) {
  if (issues.length === 0) return null;

  return (
    <Box
      p={4}
      bg="orange.50"
      borderRadius="md"
      border="1px solid"
      borderColor="orange.100"
    >
      <VStack align="start" gap={2}>
        <HStack color="orange.700">
          <AlertCircle size={16} />
          <Text fontWeight="bold" fontSize="sm">
            Validation Issues
          </Text>
        </HStack>

        {issues.map((issue, index) => (
          <Text
            key={`${issue.field}-${index}`}
            fontSize="xs"
            color="orange.800"
          >
            • {issue.message}
          </Text>
        ))}
      </VStack>
    </Box>
  );
}
