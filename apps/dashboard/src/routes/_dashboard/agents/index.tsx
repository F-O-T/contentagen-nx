import { createFileRoute } from "@tanstack/react-router";
import { AgentListPage } from "@/pages/agent-list/ui/agent-list-page";
import { createQueryKey } from "@packages/eden";

export const Route = createFileRoute("/_dashboard/agents/")({
   loader: async ({ context }) => {
      const { eden, queryClient } = context;
      await queryClient.ensureQueryData({
         queryKey: createQueryKey("eden.api.v1.agents.get"),
         queryFn: () => eden.api.v1.agents.get(),
      });
   },
   component: AgentListPage,
});
