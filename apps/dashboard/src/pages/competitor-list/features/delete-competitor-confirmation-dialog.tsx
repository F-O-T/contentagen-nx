import type { CompetitorSelect } from "@packages/database/schema";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import { useTRPC } from "@/integrations/clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

   const deleteCompetitorMutation = useMutation({
      mutationFn: trpc.competitor.delete.mutate,
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
   });

   const handleDelete = () => {
      deleteCompetitorMutation.mutate({ id: competitor.id });
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>Delete Competitor</DialogTitle>
               <DialogDescription>
                  Are you sure you want to delete "{competitor.name}"? This action
                  cannot be undone and will remove all associated feature tracking data.
               </DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={deleteCompetitorMutation.isPending}
               >
                  Cancel
               </Button>
               <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteCompetitorMutation.isPending}
               >
                  {deleteCompetitorMutation.isPending ? "Deleting..." : "Delete"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}