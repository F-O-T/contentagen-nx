import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

type DeleteAgentDialogProps = {
   agentId: string;
   agentName: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

export function DeleteAgentDialog({
   agentId,
   agentName,
   open,
   onOpenChange,
}: DeleteAgentDialogProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const { mutate: deleteAgent, isPending } = useMutation(
      trpc.agent.delete.mutationOptions({
         onError: () => {
            toast.error("Failed to delete agent");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
            toast.success("Agent deleted successfully");
            onOpenChange(false);
         },
      }),
   );

   const handleDelete = () => {
      if (!isPending) {
         deleteAgent({ id: agentId });
      }
   };

   return (
      <DeleteConfirmationCredenza
         open={open}
         onOpenChange={onOpenChange}
         onDelete={handleDelete}
         message={`This will permanently delete the agent "${agentName}" and all associated data from our servers. This action cannot be undone.`}
      />
   );
}
