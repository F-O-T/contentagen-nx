import { DeleteConfirmationCredenza } from "@packages/ui/components/delete-confirmation-credenza";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { useCallback } from "react";
import { Users } from "lucide-react";

type TransferAgentToOrganizationDialogProps = {
   agentId: string;
   agentName: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

export function TransferAgentToOrganizationDialog({
   agentId,
   agentName,
   open,
   onOpenChange,
}: TransferAgentToOrganizationDialogProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const { mutateAsync } = useMutation(
      trpc.agent.transferToOrganization.mutationOptions({
         onError: (error) => {
            toast.error(
               error.message || "Failed to transfer agent to organization",
            );
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
            toast.success("Agent transferred to organization successfully");
         },
      }),
   );

   const handleTransfer = useCallback(async () => {
      await mutateAsync({ id: agentId });
   }, [mutateAsync, agentId]);
   //TODO: Add translation
   return (
      <DeleteConfirmationCredenza
         open={open}
         onOpenChange={onOpenChange}
         title="Transfer Agent to Organization"
         description="This will transfer ownership of this agent to your active organization. You won't be able to undo this action."
         message={`Are you sure you want to transfer "${agentName}" to your organization? This action cannot be undone.`}
         icon={Users}
         variant="default"
         onDelete={handleTransfer}
      />
   );
}
