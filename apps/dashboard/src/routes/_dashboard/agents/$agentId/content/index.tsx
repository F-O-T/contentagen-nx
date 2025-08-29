import { createFileRoute } from "@tanstack/react-router";
import { AgentContentPage } from "@/pages/agent-details/ui/agent-content-page";

export const Route = createFileRoute("/_dashboard/agents/$agentId/content/")({
   component: RouteComponent,
});

function RouteComponent() {
   const { agentId } = Route.useParams();
   return <AgentContentPage agentId={agentId} />;
}
