import { createFileRoute } from "@tanstack/react-router";
import { AgentIdeasPage } from "@/pages/agent-details/ui/agent-ideas-page";

export const Route = createFileRoute("/_dashboard/agents/$agentId/ideas/")({
   component: RouteComponent,
});

function RouteComponent() {
   const { agentId } = Route.useParams();
   return <AgentIdeasPage agentId={agentId} />;
}
