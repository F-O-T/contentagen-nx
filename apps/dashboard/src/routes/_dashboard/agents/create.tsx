import { createFileRoute } from "@tanstack/react-router";
import { CreateAgentPage } from "@/pages/agent-create/ui/create-agent-page";

export const Route = createFileRoute("/_dashboard/agents/create")({
  component: CreateAgentPage,
});
