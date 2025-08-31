import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { CheckCircle } from "lucide-react";

interface BulkApproveConfirmationCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   selectedItemsCount: number;
   onConfirm: () => void;
}

export function BulkApproveConfirmationCredenza({
   open,
   onOpenChange,
   selectedItemsCount,
   onConfirm,
}: BulkApproveConfirmationCredenzaProps) {
   return (
      <DeleteConfirmationCredenza
         open={open}
         onOpenChange={onOpenChange}
         onDelete={onConfirm}
         icon={CheckCircle}
         variant="default"
         message={`This will approve ${selectedItemsCount} content item${
            selectedItemsCount > 1 ? "s" : ""
         }. This action will make the content publicly available.`}
      />
   );
}
