import { EditAgentPage } from "@/pages/agent-edit/ui/edit-agent-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/agents/$agentId/edit")({
   component: RouteComponent,
});

function RouteComponent() {
   return <EditAgentPage />;
}
