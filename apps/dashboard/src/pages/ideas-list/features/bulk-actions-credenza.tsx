import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { CheckCircle, Trash2 } from "lucide-react";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BulkApproveConfirmationCredenza } from "./bulk-approve-confirmation-credenza";
import { BulkDeleteConfirmationCredenza } from "./bulk-delete-confirmation-credenza";

interface BulkActionsCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   selectedItems: string[];
   onClearSelection: () => void;
}

export function BulkActionsCredenza({
   open,
   onOpenChange,
   selectedItems,
   onClearSelection,
}: BulkActionsCredenzaProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [showApproveConfirmation, setShowApproveConfirmation] =
      useState(false);
   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

   const bulkApproveMutation = useMutation(
      trpc.ideas.bulkApprove?.mutationOptions({
         onSuccess: async (result: {
            approvedCount: number;
            totalSelected?: number;
            approvableCount?: number;
         }) => {
            const message =
               result.totalSelected &&
               result.approvableCount &&
               result.approvableCount < result.totalSelected
                  ? `Successfully approved ${result.approvedCount} out of ${result.totalSelected} selected ideas (${result.totalSelected - result.approvableCount} were already approved or in wrong status)`
                  : `Successfully approved ${result.approvedCount} ideas`;
            toast.success(message);
            onOpenChange(false);
            onClearSelection();
            await queryClient.invalidateQueries({
               queryKey: trpc.ideas.listAllIdeas.queryKey(),
            });
         },
         onError: (error) => {
            toast.error("Failed to approve ideas");
            console.error("Bulk approve error:", error);
         },
      }),
   );

   const bulkDeleteMutation = useMutation(
      trpc.ideas.delete.mutationOptions({
         onSuccess: async () => {
            toast.success("Successfully deleted ideas");
            onOpenChange(false);
            onClearSelection();
            await queryClient.invalidateQueries({
               queryKey: trpc.ideas.listAllIdeas.queryKey(),
            });
         },
         onError: (error) => {
            toast.error("Failed to delete ideas");
            console.error("Bulk delete error:", error);
         },
      }),
   );

   const handleBulkApprove = () => {
      if (selectedItems.length === 0) return;
      setShowApproveConfirmation(true);
   };

   const handleBulkDelete = () => {
      if (selectedItems.length === 0) return;
      setShowDeleteConfirmation(true);
   };

   const confirmBulkApprove = () => {
      bulkApproveMutation.mutate({ ids: selectedItems });
      setShowApproveConfirmation(false);
   };

   const confirmBulkDelete = () => {
      // Delete ideas one by one since there's no bulk delete endpoint
      selectedItems.forEach((id) => {
         bulkDeleteMutation.mutate({ id });
      });
      setShowDeleteConfirmation(false);
   };

   return (
      <>
         <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Bulk Actions</CredenzaTitle>
                  <CredenzaDescription>
                     Perform actions on {selectedItems.length} selected items
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaBody className="grid grid-cols-2 gap-4">
                  <SquaredIconButton
                     onClick={handleBulkApprove}
                     disabled={
                        bulkApproveMutation.isPending ||
                        bulkDeleteMutation.isPending ||
                        selectedItems.length === 0
                     }
                  >
                     <CheckCircle className="h-8 w-8" />
                     <span className="text-sm font-medium">Approve</span>
                     <span className="text-xs text-muted-foreground">
                        {selectedItems.length} items
                     </span>
                  </SquaredIconButton>

                  <SquaredIconButton
                     onClick={handleBulkDelete}
                     disabled={
                        bulkApproveMutation.isPending ||
                        bulkDeleteMutation.isPending ||
                        selectedItems.length === 0
                     }
                     destructive
                  >
                     <Trash2 className="h-8 w-8" />
                     <span className="text-sm font-medium">Delete</span>
                     <span className="text-xs text-muted-foreground">
                        {selectedItems.length} items
                     </span>
                  </SquaredIconButton>
               </CredenzaBody>
            </CredenzaContent>
         </Credenza>
         <BulkApproveConfirmationCredenza
            open={showApproveConfirmation}
            onOpenChange={setShowApproveConfirmation}
            onConfirm={confirmBulkApprove}
         />
         <BulkDeleteConfirmationCredenza
            open={showDeleteConfirmation}
            onOpenChange={setShowDeleteConfirmation}
            selectedItemsCount={selectedItems.length}
            onConfirm={confirmBulkDelete}
         />
      </>
   );
}
