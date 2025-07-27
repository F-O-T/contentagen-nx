import { AgentDetailsPage } from "@/pages/agent-details/ui/agent-details-page";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/agents/$agentId/")({
   loader: async ({ context, params }) => {
      const { agentId } = params;
      const { trpc, queryClient } = context;
      await queryClient.ensureQueryData(trpc.agent.get.queryOptions({ id: agentId }));
   },

   component: AgentDetailsPage,
});
