import { CreateAgentPage } from "@/pages/agents/agent-create/ui/create-agent-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/agents/create")({
  component: CreateAgentPage,
});
