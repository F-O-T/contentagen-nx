import { AgentDetailsPage } from "@/pages/agent-details/ui/agent-details-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/agents/$agentId/")({
   component: AgentDetailsPage,
});
