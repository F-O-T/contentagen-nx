import type { CompetitorSelect } from "@packages/database/schema";
import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { useTRPC } from "@/integrations/clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangleIcon } from "lucide-react";

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
            toast.success(`${competitor.name} has been deleted successfully.`);
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.list.queryKey(),
            });
            onOpenChange(false);
         },
         onError: (error) => {
            toast.error(`Failed to delete competitor: ${error.message}`);
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
         title="Delete Competitor"
         message={`Are you sure you want to delete "${competitor.name}"? This action cannot be undone and will remove all associated feature tracking data.`}
         icon={AlertTriangleIcon}
         variant="destructive"
      />
   );
}



