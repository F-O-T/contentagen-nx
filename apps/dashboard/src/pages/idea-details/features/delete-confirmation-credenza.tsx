import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { translate } from "@packages/localization";

interface DeleteConfirmationCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
}

export function IdeaDeleteConfirmationCredenza({
   open,
   onOpenChange,
   onConfirm,
}: DeleteConfirmationCredenzaProps) {
   return (
      <DeleteConfirmationCredenza
         open={open}
         onOpenChange={onOpenChange}
         onDelete={onConfirm}
         message={translate("pages.idea-details.confirmations.delete-message")}
      />
   );
}
