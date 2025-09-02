import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { CheckCircle } from "lucide-react";

interface ApproveConfirmationCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
}

export function ApproveConfirmationCredenza({
   open,
   onOpenChange,
   onConfirm,
}: ApproveConfirmationCredenzaProps) {
   return (
      <DeleteConfirmationCredenza
         open={open}
         onOpenChange={onOpenChange}
         onDelete={onConfirm}
         icon={CheckCircle}
         variant="default"
         message="This will approve the idea and send it to the content generation pipeline. This action will create content based on the approved idea."
      />
   );
}
