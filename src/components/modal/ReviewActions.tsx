import { CheckCircle2, Save, Trash2, XCircle } from "lucide-react";
import { Button, SimpleGrid, VStack, Text } from "@chakra-ui/react";

interface ReviewActionsProps {
  saving: boolean;
  onSave: () => void;
  onValidate: () => void;
  onReject: () => void;
  onDelete: () => void;
  hasUnsavedChanges: boolean;
}

export function ReviewActions({
  saving,
  onSave,
  onValidate,
  onReject,
  onDelete,
  hasUnsavedChanges,
}: ReviewActionsProps) {
  return (
    <VStack align="stretch" gap={2}>
      {hasUnsavedChanges && (
        <Text fontSize="sm" color="orange.400">
          Save corrections before confirming validation
        </Text>
      )}
      <SimpleGrid columns={4} gap={3} pt={4}>
        <Button w="full" colorPalette="green" loading={saving} onClick={onSave}>
          <Save size={16} />
          Save Corrections
        </Button>

        <Button
          w="full"
          colorPalette="blue"
          onClick={onValidate}
          disabled={hasUnsavedChanges}
        >
          <CheckCircle2 size={16} />
          Confirm & Validate
        </Button>

        <Button
          w="full"
          variant="outline"
          colorPalette="red"
          onClick={onReject}
        >
          <XCircle size={16} />
          Reject
        </Button>

        <Button w="full" variant="ghost" colorPalette="red" onClick={onDelete}>
          <Trash2 size={16} />
          Delete
        </Button>
      </SimpleGrid>
    </VStack>
  );
}
