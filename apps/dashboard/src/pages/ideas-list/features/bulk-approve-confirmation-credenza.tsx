import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { CheckCircle } from "lucide-react";

interface BulkApproveConfirmationCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
}

export function BulkApproveConfirmationCredenza({
   open,
   onOpenChange,
   onConfirm,
}: BulkApproveConfirmationCredenzaProps) {
   return (
      <DeleteConfirmationCredenza
         open={open}
         onOpenChange={onOpenChange}
         onDelete={onConfirm}
         icon={CheckCircle}
         variant="default"
         message="This will approve the selected ideas that are in pending status and send them to the content generation pipeline. Only pending items will be approved. This action will create content based on the approved ideas."
      />
   );
}
