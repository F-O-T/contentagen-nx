import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";

export default function useAgentDetails() {
   // Get agentId from URL params
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const trpc = useTRPC();

   // Fetch agent data using TRPC
   const { data: agent, isLoading } = useSuspenseQuery(
      trpc.agent.get.queryOptions({ id: agentId }),
   );

   return {
      agent,
      isLoading,
      uploadedFiles: agent?.uploadedFiles || [],
      agentId,
   };
}
