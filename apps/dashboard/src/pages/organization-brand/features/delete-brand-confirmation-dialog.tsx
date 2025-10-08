import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { createToast } from "@/features/error-modal/lib/create-toast";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { Loader2 } from "lucide-react";
import type { RouterOutput } from "@packages/api/client";

interface DeleteBrandConfirmationDialogProps {
   brand: RouterOutput["brand"]["list"]["items"][number];
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function DeleteBrandConfirmationDialog({
   brand,
   open,
   onOpenChange,
}: DeleteBrandConfirmationDialogProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const deleteMutation = useMutation(
      trpc.brand.delete.mutationOptions({
         onSuccess: async () => {
            createToast({
               type: "success",
               message: "Brand deleted successfully",
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.brand.getByOrganization.queryKey(),
            });
            onOpenChange(false);
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: `Failed to delete brand: ${error.message ?? "Unknown error"}`,
            });
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteMutation.mutateAsync({ id: brand.id });
      } catch (error) {
         console.error("Delete failed:", error);
      }
   };

   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Delete Brand</AlertDialogTitle>
               <AlertDialogDescription>
                  Are you sure you want to delete "{brand.name}"? This action
                  cannot be undone.
                  <br />
                  <br />
                  <span className="font-semibold text-destructive">
                     This will permanently delete all brand data, including
                     content and settings.
                  </span>
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={deleteMutation.isPending}>
                  Cancel
               </AlertDialogCancel>
               <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                  {deleteMutation.isPending ? (
                     <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                     </>
                  ) : (
                     "Delete"
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
