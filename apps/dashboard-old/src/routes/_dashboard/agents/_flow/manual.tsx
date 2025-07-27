import { CreateAgentPage } from "@/pages/agent-creation-manual/ui/create-agent-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/agents/_flow/manual")({
   component: CreateAgentPage,
});
