import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import type { AgentSelect } from "@packages/database/schema";

interface DeleteAllFilesProps {
   agent: AgentSelect;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

export function DeleteAllFiles({
   agent,
   open,
   onOpenChange,
}: DeleteAllFilesProps) {
   const isControlled = open !== undefined && onOpenChange !== undefined;
   const [internalOpen, setInternalOpen] = useState(false);

   const isOpen = isControlled ? open : internalOpen;
   const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const deleteAllMutation = useMutation(
      trpc.agentFile.deleteAllFiles.mutationOptions({
         onSuccess: async (data) => {
            toast.success(data.message || "All files deleted successfully!");
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agent.id }),
            });
            setIsOpen(false);
         },
         onError: (error) => {
            console.error("Delete all files error:", error);
            toast.error("Failed to delete all files");
         },
      }),
   );

   const handleDeleteAll = async () => {
      await deleteAllMutation.mutateAsync({
         agentId: agent.id,
      });
   };

   const uploadedFilesCount = agent.uploadedFiles?.length || 0;

   return (
      <DeleteConfirmationCredenza
         open={isOpen}
         onOpenChange={setIsOpen}
         onDelete={handleDeleteAll}
         message={`This will permanently delete all ${uploadedFilesCount} uploaded files for this agent, including documents, knowledge base entries, and file processing data. This action cannot be undone.`}
      />
   );
}
