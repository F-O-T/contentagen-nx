import { createFileRoute } from "@tanstack/react-router";
import { CreateAgentPage } from "@/pages/agents/agent-create/ui";

export const Route = createFileRoute("/agents/create")({
  component: CreateAgentPage,
});
