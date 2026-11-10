import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
interface StatsCardsProps {
  counts: Record<string, number>;
}

export function StatsCards({ counts }: StatsCardsProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const needsReview = counts.needs_review ?? 0;
  const validated = counts.validated ?? 0;
  const rejected = counts.rejected ?? 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 4 }} gap={3} w="full">
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
          <Heading size="xl">{total}</Heading>
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
            Rejected
          </Text>
          <HStack gap={2}>
            <Heading size="xl" color="red.500">
              {rejected}
            </Heading>
            <AlertCircle size={20} color="red" />
          </HStack>
        </VStack>
      </Box>
    </SimpleGrid>
  );
}
