import type { CompetitorSelect } from "@packages/database/schema";
import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { useTRPC } from "@/integrations/clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangleIcon } from "lucide-react";
import { translate } from "@packages/localization";

interface DeleteCompetitorConfirmationDialogProps {
   competitor: CompetitorSelect;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function DeleteCompetitorConfirmationDialog({
   competitor,
   open,
   onOpenChange,
}: DeleteCompetitorConfirmationDialogProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const deleteCompetitorMutation = useMutation(
      trpc.competitor.delete.mutationOptions({
         onSuccess: () => {
            toast.success(
               translate("pages.competitor-list.messages.delete-success", {
                  name: competitor.name,
               }),
            );
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.list.queryKey(),
            });
            onOpenChange(false);
         },
         onError: (error) => {
            toast.error(
               translate("pages.competitor-list.messages.delete-error", {
                  error: error.message,
               }),
            );
         },
      }),
   );

   const handleDelete = () => {
      deleteCompetitorMutation.mutate({ id: competitor.id });
   };

   return (
      <DeleteConfirmationCredenza
         open={open}
         onOpenChange={onOpenChange}
         onDelete={handleDelete}
         onCancel={() => onOpenChange(false)}
         title={translate("pages.competitor-list.modals.delete.title")}
         message={translate("pages.competitor-list.modals.delete.description", {
            name: competitor.name,
         })}
         icon={AlertTriangleIcon}
         variant="destructive"
      />
   );
}
