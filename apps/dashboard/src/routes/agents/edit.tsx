import { createFileRoute } from "@tanstack/react-router";
import { EditAgentPage } from "@/pages/agents/agent-edit/ui";

export const Route = createFileRoute("/agents/edit")({
  component: EditAgentPage,
});
