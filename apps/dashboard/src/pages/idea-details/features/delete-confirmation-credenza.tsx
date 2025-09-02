import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";

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
         message="This will permanently delete the idea and all associated data. This action cannot be undone."
      />
   );
}
