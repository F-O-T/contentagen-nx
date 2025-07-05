import { AgentDetailsPage } from "@/pages/agent-details/ui/agent-details-page";
import { createQueryKey } from "@packages/eden";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/agents/$agentId/")({
   loader: async ({ context, params }) => {
      const { agentId } = params;
      const { eden, queryClient } = context;
      await queryClient.ensureQueryData({
         queryKey: createQueryKey("eden.api.v1.agents({ id: agentId }).get"),
         queryFn: async () => await eden.api.v1.agents({ id: agentId }).get(),
      });
   },

   component: AgentDetailsPage,
});
