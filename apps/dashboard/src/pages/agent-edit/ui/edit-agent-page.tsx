import { AgentCreationManualForm } from "@/features/agent-creation-manual-form/ui/agent-creation-manual-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";

export function EditAgentPage() {
   const navigate = useNavigate();
   const { eden } = useRouteContext({
      from: "/_dashboard/agents/$agentId/edit",
   });
   const { agentId } = useParams({
      from: "/_dashboard/agents/$agentId/edit",
   });
   const { data: agent } = useSuspenseQuery({
      queryKey: ["agent", agentId],
      queryFn: async () => {
         const response = await eden.api.v1
            .agents({
               id: agentId,
            })
            .get();
         return response.data;
      },
   });
   const agentMutation = useMutation({
      mutationFn: eden.api.v1.agents({
         id: agentId,
      }).patch,
      onSuccess: () => {
         navigate({ to: "/agents" });
      },
   });

   return (
      <AgentCreationManualForm
         onSubmit={(values) => agentMutation.mutateAsync(values)}
         defaultValues={{ ...agent?.agent }}
      />
   );
}
