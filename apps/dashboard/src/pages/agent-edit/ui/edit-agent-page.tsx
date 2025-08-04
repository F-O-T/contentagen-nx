import { AgentCreationManualForm } from "@/features/manual-agent-creation-form/ui/agent-creation-manual-form";
import { useTRPC } from "@/integrations/clients";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
export function EditAgentPage() {
   const navigate = useNavigate();
   const trpc = useTRPC();
   const { agentId } = useParams({
      from: "/_dashboard/agents/$agentId/edit",
   });
   const agentMutation = useMutation(
      trpc.agent.update.mutationOptions({
         onSuccess: () => {
            toast.success("Agent created successfully!");
            navigate({
               to: "/agents",
            });
         },
         onError: (error) => {
            console.error("Error creating agent:", error);
            toast.error("Failed to create agent");
         },
      }),
   );

   const { data: agent } = useSuspenseQuery(
      trpc.agent.get.queryOptions({ id: agentId }),
   );

   return (
      <AgentCreationManualForm
         onSubmit={async (values) => {
            await agentMutation.mutateAsync({
               id: agentId,
               personaConfig: {
                  ...values,
               },
            });
         }}
         defaultValues={{ ...agent.personaConfig }}
      />
   );
}
