import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { createToast } from "@/features/error-modal/lib/create-toast";
import { translate } from "@packages/localization";
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
               message: translate(
                  "pages.brand-details.messages.brand-deleted",
               ),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.brand.getByOrganization.queryKey(),
            });
            onOpenChange(false);
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: translate("pages.brand-details.messages.delete-error", {
                  error: error.message ?? "Unknown error",
               }),
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
               <AlertDialogTitle>
                  {translate("pages.brand-details.delete-dialog.title")}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {translate(
                     "pages.brand-details.delete-dialog.description",
                     {
                        brandName: brand.name,
                     },
                  )}
                  <br />
                  <br />
                  <span className="font-semibold text-destructive">
                     {translate(
                        "pages.brand-details.delete-dialog.warning",
                     )}
                  </span>
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={deleteMutation.isPending}>
                  {translate("common.actions.cancel")}
               </AlertDialogCancel>
               <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                  {deleteMutation.isPending ? (
                     <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {translate("common.actions.deleting")}
                     </>
                  ) : (
                     translate("common.actions.delete")
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}