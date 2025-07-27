import { createFileRoute } from "@tanstack/react-router";
import { AgentListPage } from "@/pages/agent-list/ui/agent-list-page";

export const Route = createFileRoute("/_dashboard/agents/")({
   component: AgentListPage,
   loader: async ({ context }) => {
      const { trpc, queryClient } = context;
      await queryClient.ensureQueryData(trpc.agent.listByUser.queryOptions());
   },
});
