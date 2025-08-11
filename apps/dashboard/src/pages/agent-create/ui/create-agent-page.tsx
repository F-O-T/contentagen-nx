import { AgentCreationManualForm } from "@/features/manual-agent-creation-form/ui/agent-creation-manual-form";
import { useTRPC } from "@/integrations/clients";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
export function CreateAgentPage() {
   const navigate = useNavigate();
   const trpc = useTRPC();
   const { data: customer } = useSuspenseQuery(
      trpc.sessionHelper.getCustomerState.queryOptions(),
   );

   const agentMutation = useMutation(
      trpc.agent.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Agent created successfully!");
            navigate({
               params: { agentId: data.id },
               to: "/agents/$agentId",
            });
         },
         onError: (error) => {
            console.error("Error creating agent:", error);
            toast.error("Failed to create agent");
         },
      }),
   );
   useIsomorphicLayoutEffect(() => {
      if (!customer.activeSubscriptions?.length) {
         toast.error(
            "You must have an active subscription to create an agent.",
         );
         navigate({
            to: "/agents",
            replace: true,
         });
      }
   }, [customer, navigate]);
   return (
      <AgentCreationManualForm
         onSubmit={async (values) => {
            await agentMutation.mutateAsync(values);
         }}
      />
   );
}
