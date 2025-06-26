import { createFileRoute } from "@tanstack/react-router";
import { AgentListPage } from "@/pages/agent-list/ui/agent-list-page";

export const Route = createFileRoute("/_dashboard/agents/")({
  component: AgentListPage,
});
