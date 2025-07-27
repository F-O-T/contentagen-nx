import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { extractPersonaDisplayData } from "./persona-utils";

export default function useAgentDetails() {
   // Get agentId from URL params
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const trpc = useTRPC();

   // Fetch agent data using TRPC
   const { data: agent, isLoading } = useSuspenseQuery(
      trpc.agent.get.queryOptions({ id: agentId })
   );

   // Extract persona data in the old format for backward compatibility
   const personaData = agent?.personaConfig ? extractPersonaDisplayData(agent.personaConfig) : null;

   const agentWithPersonaData = agent ? {
      ...agent,
      ...personaData,
      // Keep existing fields for compatibility
      basePrompt: agent.systemPrompt,
   } : null;

   return {
      agent: agentWithPersonaData,
      isLoading,
      uploadedFiles: agent?.uploadedFiles || [],
      agentId,
   };
}
