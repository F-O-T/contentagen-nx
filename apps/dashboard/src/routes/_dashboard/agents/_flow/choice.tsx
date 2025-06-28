import { AgentCreationFlowPage } from "@/pages/agent-creation-flow-choice/ui/agent-creation-flow-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/agents/_flow/choice")({
   component: AgentCreationFlowPage,
});
