import { AgentContentRequestPage } from "@/pages/agent-content-request/ui/agent-content-request-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
   "/_dashboard/agents/$agentId/content/request",
)({
   component: RouteComponent,
});

function RouteComponent() {
   return <AgentContentRequestPage />;
}
