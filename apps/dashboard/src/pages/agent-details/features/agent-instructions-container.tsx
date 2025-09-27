import type { AgentSelect } from "@packages/database/schema";
import { AgentInstructionsDisplay } from "./agent-instructions-display";
import { EditAgentInstructions } from "./edit-agent-instructions";

interface AgentInstructionsContainerProps {
   agent: AgentSelect;
   isEditing: boolean;
   setIsEditing: (editing: boolean) => void;
}

export function AgentInstructionsContainer({
   agent,
   isEditing,
   setIsEditing,
}: AgentInstructionsContainerProps) {
   if (isEditing) {
      return <EditAgentInstructions agent={agent} setEditing={setIsEditing} />;
   }

   return <AgentInstructionsDisplay personaConfig={agent.personaConfig} />;
}
