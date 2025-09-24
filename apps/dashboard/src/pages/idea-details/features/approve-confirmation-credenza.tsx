import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { CheckCircle } from "lucide-react";
import { translate } from "@packages/localization";

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
         message={translate("pages.idea-details.confirmations.approve-message")}
      />
   );
}
