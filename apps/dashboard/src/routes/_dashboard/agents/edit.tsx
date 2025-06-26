import { createFileRoute } from "@tanstack/react-router";
import { EditAgentPage } from "@/pages/agent-edit/ui/edit-agent-page";

export const Route = createFileRoute("/_dashboard/agents/edit")({
  component: EditAgentPage,
});
